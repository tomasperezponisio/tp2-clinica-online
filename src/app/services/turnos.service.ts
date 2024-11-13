import { Injectable } from '@angular/core';
import {Turno} from "../models/turno";
import {
  addDoc,
  collection,
  collectionData,
  doc,
  Firestore,
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

}
