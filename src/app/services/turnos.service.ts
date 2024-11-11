import { Injectable } from '@angular/core';
import {Turno} from "../models/turno";
import {addDoc, collection, Firestore, getDocs, query, where} from "@angular/fire/firestore";
import {Especialista} from "../models/especialista";
import {Slot} from "../models/slot";

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

  async generateAvailableSlots(especialista: Especialista, especialidad: string): Promise<Slot[]> {
    const slots: Slot[] = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 15);

    const disponibilidad = especialista.disponibilidad.find(disp => disp.especialidad === especialidad);

    if (!disponibilidad) {
      return slots; // No availability for this specialty
    }

    // Fetch existing bookings for this specialist
    const bookedSlots = await this.getBookedSlots(especialista.uid);

    // Loop through each day within the next 15 days
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayName = this.getDayName(d);

      if (disponibilidad.dias.includes(dayName)) {
        const fecha = this.formatDate(d);
        const duracion = disponibilidad.duracionTurno;
        let horaInicio = this.parseTime(disponibilidad.horarioInicio);
        const horaFin = this.parseTime(disponibilidad.horarioFin);

        // Generate time slots
        while (horaInicio + duracion <= horaFin) {
          const hora = this.formatTime(horaInicio);

          // Check if this slot is already booked
          const slotKey = `${fecha}_${hora}`;
          if (!bookedSlots.has(slotKey)) {
            slots.push({
              fecha,
              hora,
            });
          }

          horaInicio += duracion;
        }
      }
    }

    return slots;
  }

  private async getBookedSlots(especialistaUid: string): Promise<Set<string>> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialistaUid', '==', especialistaUid));
    const querySnapshot = await getDocs(q);
    const bookedSlots = new Set<string>();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const key = `${data['fecha']}_${data['hora']}`;
      bookedSlots.add(key);
    });
    return bookedSlots;
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
}
