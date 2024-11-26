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

  /**
   * Obtiene y cuenta los turnos por especialidad desde la base de datos.
   *
   * Esta función se conecta a la colección 'turnos' en Firestore, obtiene todos los documentos de
   * dicha colección y cuenta cuántos turnos hay para cada especialidad.
   *
   * @return {Promise<Object>} Un objeto donde las llaves son las especialidades y los valores
   * son la cantidad de turnos correspondientes a cada especialidad.
   */
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

  /**
   * Obtiene los turnos dentro de un rango de fechas y los agrupa por fecha y estado.
   *
   * @param {string} startDate - La fecha de inicio del rango en formato AAAA-MM-DD.
   * @param {string} endDate - La fecha de fin del rango en formato AAAA-MM-DD.
   * @return {Promise<any>} Una promesa que resuelve en un objeto donde las claves son las fechas
   * y los valores son objetos que contienen la cantidad de turnos en cada estado
   * (pendiente, aceptado, rechazado, cancelado, realizado).
   */
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

  /**
   * Verifica si una fecha dada es un domingo.
   *
   * @param {string} dateStr - La fecha en formato de cadena (YYYY-MM-DD).
   * @return {boolean} - `true` si la fecha es un domingo, de lo contrario `false`.
   */
  esDomingo(dateStr: string): boolean {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDay() === 0; // 0 = Sunday
  }

  /**
   * Formatea una cadena de fecha en el formato 'dd/MM/yyyy'.
   *
   * @param {string} dateStr - Cadena que representa una fecha en formato ISO (yyyy-MM-dd).
   * @return {string} La fecha formateada en el formato 'dd/MM/yyyy'.
   */
  formatearFecha(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return formatDate(date, 'dd/MM/yyyy', 'es-AR');
  }

  /**
   * Recupera una lista de registros de inicio de sesión desde Firestore.
   *
   * @return {Promise<any[]>} Una promesa que resuelve a una matriz de objetos
   * que representan los datos de los registros de inicio de sesión.
   */
  async getLogins(): Promise<any[]> {
    const loginsRef = collection(this.firestore, 'logins');
    const snapshot = await getDocs(loginsRef);
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Trae una lista de logins dentro de un rango de fechas proporcionado.
   *
   * @param {string} startDate - La fecha de inicio del rango en formato 'YYYY-MM-DD'.
   * @param {string} endDate - La fecha de fin del rango en formato 'YYYY-MM-DD'.
   * @return {Promise<any[]>} - Una promesa que resuelve a una lista de objetos de login que caen dentro del rango de fechas especificado.
   */
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

  /**
   * Trae y cuenta los turnos agrupados por médico en un rango de fechas especificado.
   *
   * @param {string} startDate - Fecha de inicio del rango deseado en formato ISO.
   * @param {string} endDate - Fecha de fin del rango deseado en formato ISO.
   * @return {Promise<any>} Un objeto que contiene la cantidad de turnos agrupados por nombre del medico.
   */
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

  /**
   * Obtiene y cuenta los turnos finalizados por cada médico en un rango de fechas.
   *
   * @param {string} startDate - La fecha de inicio del rango (inclusive).
   * @param {string} endDate - La fecha de fin del rango (inclusive).
   * @return {Promise<any>} Un objeto donde las claves son los nombres de los médicos y los valores son la cantidad de turnos finalizados.
   */
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
