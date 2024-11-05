export class Especialista {
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;
  especialidad: string[];
  email: string;
  imagenUno: string;

  constructor(
    nombre: string,
    apellido: string,
    edad: number,
    dni: number,
    especialidad: string[],
    email: string,
    imagenUno: string,
  ) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.edad = edad;
    this.dni = dni;
    this.especialidad = especialidad;
    this.email = email;
    this.imagenUno = imagenUno;
  }
}
