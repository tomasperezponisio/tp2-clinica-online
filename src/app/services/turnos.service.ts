import { Injectable } from '@angular/core';
import {Turno} from "../models/turno";
import {
  addDoc,
  collection,
  collectionData,
  doc,
  Firestore, getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "@angular/fire/firestore";
import {Especialista} from "../models/especialista";
import {Bloque} from "../models/bloque";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  constructor(
    private firestore: Firestore
  ) { }

  /**
   * Solicita un turno agregando un nuevo documento en la colección de turnos en Firestore.
   *
   * @param {Turno} turno - El objeto turno que contiene la información del turno a solicitar.
   * @return {Promise<void>} - Una promesa que se resuelve cuando se completa la operación de agregar el turno.
   */
  async solicitarTurno(turno: Turno): Promise<void> {
    const turnosCollection = collection(this.firestore, 'turnos');
    await addDoc(turnosCollection, turno);
  }

  /**
   * Genera franjas horarias disponibles para un especialista y especialidad dados dentro de los próximos 15 días.
   *
   * @param {Especialista} especialista - El especialista cuya disponibilidad se está verificando.
   * @param {string} especialidad - La especialidad para la cual se requiere disponibilidad.
   * @return {Promise<Bloque[]>} - Una promesa que se resuelve en un arreglo de franjas horarias disponibles.
   */
  async generarBloquesDisponibles(especialista: Especialista, especialidad: string): Promise<Bloque[]> {
    const bloques: Bloque[] = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 15);

    const disponibilidad = especialista.disponibilidad.find(disp => disp.especialidad === especialidad);

    if (!disponibilidad) {
      return bloques; // No hay bloques disponibles para esta especialidad
    }

    // Traigo los bloques reservados para este especialista
    const bloquesReservados = await this.traerBloquesReservados(especialista.uid);

    // Itero de aca a 15 días por los días del especialista en la especialidad
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayName = this.getDayName(d);

      if (disponibilidad.dias.includes(dayName)) {
        const fecha = this.formatDate(d);
        const duracion = disponibilidad.duracionTurno;
        let horaInicio = this.parseTime(disponibilidad.horarioInicio);
        const horaFin = this.parseTime(disponibilidad.horarioFin);

        // Genero bloques de tiempo en base a la hora de inicio y la duración
        while (horaInicio + duracion <= horaFin) {
          const hora = this.formatTime(horaInicio);

          // Salteo los bloques de horas pasadas
          if (fecha === this.formatDate(today)) {
            const currentMinutes = this.getCurrentTimeInMinutes();
            if (horaInicio < currentMinutes) {
              horaInicio += duracion;
              continue;
            }
          }

          // Verifico si en este bloque ya hay un turno reservado
          const slotKey = `${fecha}_${hora}`;
          if (!bloquesReservados.has(slotKey)) {
            bloques.push({
              fecha,
              hora,
            });
          }

          horaInicio += duracion;
        }
      }
    }

    return bloques;
  }

  /**
   * Obtiene la hora actual en minutos desde la medianoche.
   *
   * @return El tiempo actual en minutos desde las 00:00 horas.
   */
  private getCurrentTimeInMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Recupera un conjunto de franjas horarias reservadas para un especialista dado desde la base de datos de Firestore.
   *
   * @param {string} especialistaUid - El identificador único del especialista.
   * @return {Promise<Set<string>>} Una promesa que se resuelve en un conjunto de cadenas que representan las franjas horarias reservadas, donde cada franja es una combinación de fecha y hora formateada como 'fecha_hora'.
   */
  private async traerBloquesReservados(especialistaUid: string): Promise<Set<string>> {
    const bloquesReservados = new Set<string>();

    // Define the statuses that indicate the appointment occupies a time slot
    const occupiedStatuses = ['pendiente', 'aceptado'];

    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(
      turnosRef,
      where('especialistaUid', '==', especialistaUid),
      where('estado', 'in', occupiedStatuses)
    );

    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      const fecha = data['fecha'];
      const hora = data['hora'];
      const slotKey = `${fecha}_${hora}`;
      bloquesReservados.add(slotKey);
    });

    return bloquesReservados;
  }

  /**
   * Convierte una cadena de tiempo en minutos.
   *
   * @param {string} timeStr - La cadena de tiempo en formato "HH:MM".
   * @return {number} - El tiempo en minutos.
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convierte una cantidad de minutos en una representación de tiempo con formato hh:mm.
   *
   * @param {number} minutes - La cantidad de minutos que se desea convertir.
   * @return {string} - La representación de tiempo en formato hh:mm.
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Formatea un objeto de fecha en una cadena con el formato 'YYYY-MM-DD'.
   *
   * @param {Date} date - El objeto de fecha que se formateará.
   * @return {string} La fecha formateada en el formato 'YYYY-MM-DD'.
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  }

  /**
   *
   * Devuelve el nombre del día de la semana en español para una fecha dada.
   *
   * @param {Date} date - La fecha de la cual se desea obtener el nombre del día de la semana.
   * @return {string} El nombre del día de la semana en español.
   */
  private getDayName(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  /**
   * Recupera los turnos de un paciente específico a partir de su UID.
   *
   * @param {string} pacienteUid - El UID del paciente cuyos turnos se desean recuperar.
   * @return {Observable<Turno[]>} Un observable que emite una lista de turnos del paciente especificado.
   */
  traerTurnosPorUidDePaciente(pacienteUid: string): Observable<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('pacienteUid', '==', pacienteUid));
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Obtiene los turnos de un especialista según su UID.
   *
   * @param {string} especialistaUid - El UID del especialista.
   * @return {Observable<Turno[]>} - Un observable que emite una lista de turnos asociados al especialista.
   */
  getTurnosByEspecialistaUid(especialistaUid: string): Observable<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialistaUid', '==', especialistaUid));
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Actualiza un turno existente en la base de datos.
   *
   * @param {Turno} turno - El objeto Turno que contiene los datos del turno a actualizar.
   *                         Debe incluir una propiedad 'id' que identifique al turno.
   * @return {Promise<void>} - Una promesa que se resuelve cuando la actualización es exitosa
   *                           o se rechaza si el ID del turno falta o si ocurre un error durante la actualización.
   */
  updateTurno(turno: Turno): Promise<void> {
    if (!turno.id) {
      return Promise.reject('Turno ID is missing');
    }
    const turnoDocRef = doc(this.firestore, 'turnos', turno.id);
    return updateDoc(turnoDocRef, { ...turno });
  }

  // turnos.service.ts
  /**
   * Obtiene todos los turnos almacenados en la colección 'turnos' de Firestore.
   *
   * @return {Observable<Turno[]>} Un observable que emite una lista de objetos Turno.
   */
  traerTodosLosTurnos(): Observable<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef); // You can apply filters if needed
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Obtiene la historia clínica del paciente especificado por el UID.
   *
   * @param {string} uid - El UID del paciente cuya historia clínica se desea obtener.
   * @return {Promise<any[]>} Una promesa que se resuelve en un arreglo con las historias clínicas del paciente.
   */
  async traerHistoriaClinicaPaciente(uid: string): Promise<any[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('pacienteUid', '==', uid), where('estado', '==', 'realizado'));

    const snapshot = await getDocs(q);
    const historiasClinicas: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data['historiaClinica']) {
        historiasClinicas.push({
          especialistaNombre: data['especialistaNombre'],
          especialidad: data['especialidad'],
          fecha: data['fecha'],
          hora: data['hora'],
          reseña: data['reseña'],
          ...data['historiaClinica'],
        });
      }
    });

    return historiasClinicas;
  }

  /**
   * Trae una lista de pacientes atendidos por un especialista en particular.
   *
   * @param {string} especialistaUid - El UID del especialista cuyos pacientes atendidos se quieren obtener.
   * @return {Promise<any[]>} Una promesa que resuelve a un array de objetos que contienen información de los pacientes, como su UID, nombre completo e imagen.
   */
  async traerPacientesAtendidos(especialistaUid: string): Promise<any[]> {
    const turnosRef = collection(this.firestore, 'turnos');

    // Query for turnos where the especialista has attended the patient
    const q = query(
      turnosRef,
      where('especialistaUid', '==', especialistaUid),
      where('estado', '==', 'realizado')
    );

    const snapshot = await getDocs(q);
    const pacientesMap = new Map<string, any>();

    // Rename loop variable to avoid conflict with `doc` function
    for (const turnoDoc of snapshot.docs) {
      const data = turnoDoc.data();
      const pacienteUid = data['pacienteUid'];

      if (pacienteUid && !pacientesMap.has(pacienteUid)) {
        // Fetch the patient details from the `usuarios` collection
        const pacienteDocRef = doc(this.firestore, 'usuarios', pacienteUid); // Construct document reference correctly
        const pacienteDoc = await getDoc(pacienteDocRef);

        if (pacienteDoc.exists()) {
          const pacienteData = pacienteDoc.data();
          pacientesMap.set(pacienteUid, {
            uid: pacienteUid,
            nombre: pacienteData['nombre'] + ' ' + pacienteData['apellido'],
            imagenUno: pacienteData['imagenUno'], // Fetch image from usuarios collection
          });
        }
      }
    }

    return Array.from(pacientesMap.values());
  }

}
