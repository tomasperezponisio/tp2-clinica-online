export class Admin {
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;
  email: string;
  imagenUno: string;

  constructor(
    nombre: string,
    apellido: string,
    edad: number,
    dni: number,
    email: string,
    imagenUno: string,
  ) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.edad = edad;
    this.dni = dni;
    this.email = email;
    this.imagenUno = imagenUno;
  }
}
