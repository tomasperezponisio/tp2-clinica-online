export class Especialista {
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;
  especialidad: string[];
  email: string;
  imagenUno: string;
  tipo: string;
  verificado: boolean;
  disponibilidad: Disponibilidad[];
  uid: string;

  constructor(
    nombre: string,
    apellido: string,
    edad: number,
    dni: number,
    especialidad: string[],
    email: string,
    imagenUno: string,
    tipo: string = 'especialista',
    verificado: boolean = false,
    disponibilidad: Disponibilidad[] = [],
    uid: string = ''
  ) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.edad = edad;
    this.dni = dni;
    this.especialidad = especialidad;
    this.email = email;
    this.imagenUno = imagenUno;
    this.tipo = tipo;
    this.verificado = verificado;
    this.disponibilidad = disponibilidad;
    this.uid = uid;
  }
}

export interface Disponibilidad {
  especialidad: string;
  dias: string[]; // e.g., ['Lunes', 'Miércoles']
  horarioInicio: string; // e.g., '08:00'
  horarioFin: string;    // e.g., '16:00'
  duracionTurno: number; // Duration in minutes, minimum 30
}
