export class Paciente {
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;
  obraSocial: string;
  email: string;
  imagenUno: string;
  imagenDos: string;
  tipo: string;

  constructor(
    nombre: string,
    apellido: string,
    edad: number,
    dni: number,
    obraSocial: string,
    email: string,
    imagenUno: string,
    imagenDos: string,
    tipo: string = 'paciente'
  ) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.edad = edad;
    this.dni = dni;
    this.obraSocial = obraSocial;
    this.email = email;
    this.imagenUno = imagenUno;
    this.imagenDos = imagenDos;
    this.tipo = tipo;
  }
}
