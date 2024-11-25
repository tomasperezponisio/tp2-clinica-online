import { Injectable } from '@angular/core';
import {Firestore, collection, getDocs, where, query} from '@angular/fire/firestore';
import { formatDate } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  constructor(
    private firestore: Firestore
  ) {}

  async traerTurnosPorEspecialidad(): Promise<any> {
    const turnosRef = collection(this.firestore, 'turnos');
    const snapshot = await getDocs(turnosRef);
    const turnos = snapshot.docs.map(doc => doc.data());

    const counts = turnos.reduce((acc, turno: any) => {
      acc[turno.especialidad] = (acc[turno.especialidad] || 0) + 1;
      return acc;
    }, {});

    return counts;
  }

  async traerTurnosPorDiaAndEstado(startDate: string, endDate: string): Promise<any> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(
      turnosRef,
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate)
    );

    const snapshot = await getDocs(q);
    const turnos = snapshot.docs.map(doc => doc.data());

    // Group turnos by date and estado
    const counts = turnos.reduce((acc: any, turno: any) => {
      if (!this.esDomingo(turno.fecha)) {
        const formattedDate = this.formatearFecha(turno.fecha);
        if (!acc[formattedDate]) {
          acc[formattedDate] = { pendiente: 0, aceptado: 0, rechazado: 0, cancelado: 0, realizado: 0 };
        }
        acc[formattedDate][turno.estado] = (acc[formattedDate][turno.estado] || 0) + 1;
      }
      return acc;
    }, {});

    return counts;
  }

  esDomingo(dateStr: string): boolean {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDay() === 0; // 0 = Sunday
  }

  formatearFecha(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return formatDate(date, 'dd/MM/yyyy', 'es-AR');
  }

  async getLogins(): Promise<any[]> {
    const loginsRef = collection(this.firestore, 'logins');
    const snapshot = await getDocs(loginsRef);
    return snapshot.docs.map(doc => doc.data());
  }

  async traerLoginsPorRangoDeFecha(startDate: string, endDate: string): Promise<any[]> {
    const loginsRef = collection(this.firestore, 'logins');
    const q = query(
      loginsRef,
      where('fecha', '>=', new Date(startDate + 'T00:00:00')),
      where('fecha', '<=', new Date(endDate + 'T23:59:59'))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  async traerTurnosPorMedico(startDate: string, endDate: string): Promise<any> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(
      turnosRef,
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate)
    );

    const snapshot = await getDocs(q);
    const turnos = snapshot.docs.map(doc => doc.data());

    // Group turnos by medico
    const counts = turnos.reduce((acc: any, turno: any) => {
      const medico = turno.especialistaNombre || 'Desconocido'; // Use a fallback name if no name is found
      if (!acc[medico]) {
        acc[medico] = 0;
      }
      acc[medico] += 1;
      return acc;
    }, {});

    return counts;
  }

  async traerTurnosFinalizadosPorMedico(startDate: string, endDate: string): Promise<any> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(
      turnosRef,
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate),
      where('estado', '==', 'realizado') // Only include finalized turnos
    );

    const snapshot = await getDocs(q);
    const turnos = snapshot.docs.map(doc => doc.data());

    // Group turnos by medico
    const counts = turnos.reduce((acc: any, turno: any) => {
      const medico = turno.especialistaNombre || 'Desconocido'; // Use a fallback name if no name is found
      if (!acc[medico]) {
        acc[medico] = 0;
      }
      acc[medico] += 1;
      return acc;
    }, {});

    return counts;
  }



}
