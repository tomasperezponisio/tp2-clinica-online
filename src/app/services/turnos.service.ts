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

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  }

  private getDayName(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  traerTurnosPorUidDePaciente(pacienteUid: string): Observable<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('pacienteUid', '==', pacienteUid));
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  getTurnosByEspecialistaUid(especialistaUid: string): Observable<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialistaUid', '==', especialistaUid));
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  updateTurno(turno: Turno): Promise<void> {
    if (!turno.id) {
      return Promise.reject('Turno ID is missing');
    }
    const turnoDocRef = doc(this.firestore, 'turnos', turno.id);
    return updateDoc(turnoDocRef, { ...turno });
  }

  // turnos.service.ts
  traerTodosLosTurnos(): Observable<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef); // You can apply filters if needed
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Retrieves all 'realizado' turnos for a given patient.
   * @param pacienteUid - The patient's UID.
   * @returns A Promise with a list of turnos containing historiaClinica.
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
   * Retrieves all unique patients an especialista has attended at least once.
   * @param especialistaUid - The specialist's UID.
   * @returns A Promise with a list of patients.
   */
/*
  async traerPacientesAtendidos(especialistaUid: string): Promise<any[]> {
    // Reference to the 'turnos' collection in Firestore
    const turnosRef = collection(this.firestore, 'turnos');

    // Query to find all turnos attended by the current especialista with status 'realizado'
    const q = query(
      turnosRef,
      where('especialistaUid', '==', especialistaUid), // Filter by especialista's UID
      where('estado', '==', 'realizado') // Only include finalized appointments
    );

    // Perform the query and get the matching documents
    const snapshot = await getDocs(q);

    // Create a map to store patients (avoids duplicates)
    const pacientesMap = new Map<string, any>();

    // A set to track all unique patient UIDs attended by this especialista
    const pacienteUids = new Set<string>();

    // Iterate through each turno (appointment) document from the query results
    snapshot.forEach(doc => {
      const data = doc.data(); // Get the appointment data

      // Check if the appointment has a valid patient UID
      if (data['pacienteUid']) {
        pacienteUids.add(data['pacienteUid']); // Add the patient's UID to the set

        // If the patient is not already in the map, add a new entry
        if (!pacientesMap.has(data['pacienteUid'])) {
          pacientesMap.set(data['pacienteUid'], {
            uid: data['pacienteUid'], // Patient's UID
            nombre: data['pacienteNombre'], // Patient's name
            historiasClinicas: [], // Initialize an empty array for their medical histories
          });
        }
      }
    });

    // Now we need to fetch all medical histories (historias clinicas) for the patients
    for (const pacienteUid of pacienteUids) {
      // Fetch all finalized medical histories for this patient
      const historias = await this.traerHistoriaClinicaPaciente(pacienteUid);

      // Retrieve the existing patient object from the map
      const paciente = pacientesMap.get(pacienteUid);

      // If the patient exists in the map, append their medical histories
      if (paciente) {
        paciente.historiasClinicas.push(...historias); // Add all medical histories to the array
      }
    }

    // Convert the map to an array and return it
    return Array.from(pacientesMap.values());
  }
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
