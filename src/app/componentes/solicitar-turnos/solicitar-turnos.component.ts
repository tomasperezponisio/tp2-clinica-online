import {Component, LOCALE_ID, OnInit} from '@angular/core';
import {Especialista} from "../../models/especialista";
import {Router} from "@angular/router";
import {UsuariosService} from "../../services/usuarios.service";
import {Bloque} from "../../models/bloque";
import {TurnosService} from "../../services/turnos.service";
import {Turno} from "../../models/turno";
import {AuthService} from "../../services/auth.service";
import {DatePipe, NgForOf, NgIf, registerLocaleData, TitleCasePipe} from "@angular/common";
import localeEsAr from '@angular/common/locales/es-AR';
import {AlertService} from "../../services/alert.service";

registerLocaleData(localeEsAr, 'es-AR');

@Component({
  selector: 'app-solicitar-turnos',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    DatePipe,
    TitleCasePipe,
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'es-AR'},
  ],
  templateUrl: './solicitar-turnos.component.html',
  styleUrl: './solicitar-turnos.component.css'
})
export class SolicitarTurnosComponent implements OnInit {
  // Pasos
  step: number = 1;
  maxStep: number = 4;

  tipoDeUsuario: string = '';

  // Data
  especialidades: string[] = [];
  especialistas: Especialista[] = [];
  bloquesDisponibles: Bloque[] = [];
  pacientes: any[] = [];
  imagenesEspecialidades: any[] = [
    {'cardiología':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/cardiologia.png?alt=media&token=a049af7f-01ad-4d8a-ab50-fbcec4fbead7'},
    {'clínica':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/clinica.png?alt=media&token=cc5faae7-1f29-4fbb-a453-a97717fdc3f8'},
    {'Default':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/default.png?alt=media&token=a1f3dad0-8eaf-4d77-92b3-18c8a777235a'},
    {'neonatología':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/neonatologia.png?alt=media&token=675a074e-c18b-44fb-84a6-bacf1307b1df'},
    {'psicología':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/psicologia.png?alt=media&token=a6976a3a-9df4-4b9f-8c73-7e6982cd96b3'},
    {'psiquiatría':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/psiquiatria.png?alt=media&token=ef2b2294-c1ae-43d4-9d86-04b6b71e6abf'},
    {'toxicología':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/toxicologia.png?alt=media&token=cf5a91a2-a506-41b7-9e30-329c553c58bf'},
    {'traumatología':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/traumatologia.png?alt=media&token=82690d59-d58a-4f38-8fe3-7226be03f3e2'},
    {'pediatría':'https://firebasestorage.googleapis.com/v0/b/tp2-clinica-online.appspot.com/o/pediatria.png?alt=media&token=f08a38a9-2485-4f33-b7c8-0ca103a86ea5'}
  ]

  // Selecciones
  especialidadSeleccionada: string = '';
  especialistaSeleccionado: Especialista | null = null;
  bloqueSeleccionado: Bloque | null = null;
  pacienteSeleccionado: any = null;
  fechaSeleccionada: string | null = null;

  // Usuario actual
  usuarioActual: any;

  constructor(
    private usuariosService: UsuariosService,
    private turnosService: TurnosService,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
  }

  /**
   * Inicializa el componente obteniendo el usuario actual y actualizando su rol.
   * Si el usuario es admin, obtiene la lista de pacientes y ajusta el paso máximo.
   * También obtiene la lista de especialidades.
   * @return {void} No retorna un valor.
   */
  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe(user => {
      this.usuarioActual = user;
      this.tipoDeUsuario = user.tipo;

      if (this.tipoDeUsuario === 'admin') {
        this.traerPacientes();
        this.maxStep = 5;
      }
    });

    this.traerEspecialidades();
  }

  /**
   * Método para obtener la lista de pacientes a través del servicio `usuariosService`.
   *
   * @return {void} No retornará ningún valor directamente, pero suscribirá a los datos de pacientes.
   */
  traerPacientes(): void {
    this.usuariosService.traerPacientes().subscribe(pacientes => {
      this.pacientes = pacientes;
    });
  }

  /**
   * Selecciona un paciente y avanza al siguiente paso en el proceso.
   *
   * @param {object} paciente - El paciente que será seleccionado.
   * @return {void} - No retorna ningún valor.
   */
  elegirPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.step += 1; // Move to the next step
  }

  /**
   * Método que trae las especialidades desde el servicio de usuarios y las asigna a la propiedad local.
   *
   * @return {void} Este método no retorna un valor explícito, actualiza la propiedad "especialidades" de la instancia actual.
   */
  traerEspecialidades(): void {
    this.usuariosService.traerEspecialidades().subscribe(especialidades => {
      this.especialidades = especialidades;
    });
  }

  /**
   * Selecciona una especialidad y avanza al siguiente paso del proceso.
   *
   * @param {string} especialidad - El nombre de la especialidad que se va a seleccionar.
   * @return {void} Esta función no retorna un valor.
   */
  elegirEspecialidad(especialidad: string): void {
    this.especialidadSeleccionada = especialidad;
    this.step += 1; // Move to the next step
    this.traerEspecialistas();
  }

  /**
   * Método que obtiene la lista de especialistas según la especialidad seleccionada.
   * Realiza una llamada al servicio usuariosService para obtener los especialistas.
   * Al suscribirse, asigna la lista de especialistas obtenida a la propiedad especialistas.
   *
   * @return {void} No devuelve ningún valor.
   */
  traerEspecialistas(): void {
    this.usuariosService.traerEspecialistasPorEspecialidad(this.especialidadSeleccionada).subscribe(especialistas => {
      this.especialistas = especialistas;
    });
  }

  /**
   * Selecciona un especialista y avanza al siguiente paso del proceso.
   *
   * @param {Especialista} especialista - El especialista seleccionado.
   * @return {void} No devuelve ningún valor.
   */
  elegirEspecialista(especialista: Especialista): void {
    this.especialistaSeleccionado = especialista;
    this.step += 1; // Move to the next step
    this.traerBloquesDisponibles();
  }

  /**
   * Método para traer los bloques disponibles.
   * Este método verifica si se ha seleccionado un especialista y una especialidad,
   * y en ese caso, solicita al servicio de turnos los bloques disponibles para dicha combinación.
   * Los bloques disponibles son luego asignados a la propiedad 'bloquesDisponibles'.
   *
   * @return {void} No retorna ningún valor.
   */
  traerBloquesDisponibles(): void {
    if (this.especialistaSeleccionado && this.especialidadSeleccionada) {
      this.turnosService.generarBloquesDisponibles(this.especialistaSeleccionado, this.especialidadSeleccionada).then(slots => {
        this.bloquesDisponibles = slots;
      });
    }
  }

  /**
   * Selecciona un bloque específico y avanza un paso en el proceso.
   *
   * @param {Bloque} slot - El bloque que se va a seleccionar.
   * @return {void} No retorna ningún valor.
   */
  seleccionarBloque(slot: Bloque): void {
    this.bloqueSeleccionado = slot;
    this.step += 1; // Move to the next step
  }

  /**
   * Confirma la solicitud de un turno médico.
   *
   * Basado en el rol del usuario (admin o paciente), determina el paciente adecuado y
   * crea un objeto de turno que incluye datos del paciente, especialista, especialidad,
   * fecha y hora del turno. Si todos los datos necesarios están disponibles, solicita el turno
   * a través del servicio `turnosService` y muestra una alerta de éxito en caso de que la
   * solicitud sea exitosa. En caso de error, imprime el error en la consola.
   *
   * @return {void} No retorna ningún valor.
   */
  confirmarTurno(): void {
    // Determine the paciente based on user role
    const paciente = this.tipoDeUsuario === 'admin' ? this.pacienteSeleccionado : this.usuarioActual;

    if (paciente && this.especialistaSeleccionado && this.especialidadSeleccionada && this.bloqueSeleccionado) {
      const turno: Turno = {
        pacienteUid: this.usuarioActual.uid,
        pacienteNombre: `${this.usuarioActual.nombre} ${this.usuarioActual.apellido}`,
        especialistaUid: this.especialistaSeleccionado.uid,
        especialistaNombre: `${this.especialistaSeleccionado.nombre} ${this.especialistaSeleccionado.apellido}`,
        especialidad: this.especialidadSeleccionada,
        fecha: this.bloqueSeleccionado.fecha,
        hora: this.bloqueSeleccionado.hora,
        estado: 'pendiente',
      };

      this.turnosService.solicitarTurno(turno).then(() => {
        // @ts-ignore
        this.alertService.customAlert('Turno reservado con éxito!', `Turno reservado para el ${this.bloqueSeleccionado.fecha} a las ${this.bloqueSeleccionado.hora}`, 'success').then(() => {
          this.resetSelections();
        });
      }).catch(error => {
        console.error('Error al solicitar turno:', error);
      });
    }
  }

  /**
   * Restablece las selecciones en la aplicación.
   *
   * Este método reinicia la variable `step` a 1 y limpia todas las selecciones previas
   * de especialidad, especialista, bloque y paciente.
   *
   * @return {void} Este método no retorna ningún valor.
   */
  resetSelections(): void {
    this.step = 1;
    this.especialidadSeleccionada = '';
    this.especialistaSeleccionado = null;
    this.bloqueSeleccionado = null;
    this.pacienteSeleccionado = null;
  }

  /**
   * Obtiene un arreglo de objetos Date a partir de las fechas únicas en los bloques disponibles.
   *
   * @return {Date[]} Arreglo de objetos Date correspondientes a las fechas únicas.
   */
  traerFechas(): Date[] {
    const dateStrings = Array.from(new Set(this.bloquesDisponibles.map(slot => slot.fecha)));
    return dateStrings.map(dateStr => new Date(dateStr + 'T00:00:00'));
  }

  /**
   * Obtiene una lista de bloques disponibles filtrados por la fecha proporcionada.
   *
   * @param {string | Date | null} date - La fecha para filtrar los bloques. Puede ser una cadena en formato
   * de fecha o un objeto Date. Si es null, se devolverá un arreglo vacío.
   * @return {Bloque[]} Un arreglo de bloques disponibles que coinciden con la fecha proporcionada.
   */
  traerBloquesPorFecha(date: string | Date | null): Bloque[] {
    if (!date) {
      return []; // Return an empty array if no date is provided
    }

    const dateStr = typeof date === 'string' ? date : this.formatearFecha(date); // Handle both types
    return this.bloquesDisponibles.filter(slot => slot.fecha === dateStr);
  }

  /**
   * Formatea una fecha dada en el formato "YYYY-MM-DD".
   *
   * @param {Date} date - La fecha que se desea formatear.
   * @return {string} La fecha formateada como una cadena en el formato "YYYY-MM-DD".
   */
  formatearFecha(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtiene la URL de la imagen correspondiente a la especialidad dada.
   *
   * @param {string} especialidad - El nombre de la especialidad para la cual se busca la imagen.
   * @return {string} La URL de la imagen correspondiente a la especialidad dada,
   *                   o la imagen por defecto si no se encuentra una coincidencia.
   */
  traerImagenDeEspecialidad(especialidad: string): string {
    const lowerEspecialidad = especialidad.toLowerCase();
    const match = this.imagenesEspecialidades.find(imgObj => Object.keys(imgObj)[0].toLowerCase() === lowerEspecialidad);

    if (match) {
      return match[Object.keys(match)[0]]; // Return the matched image URL
    }

    const defaultMatch = this.imagenesEspecialidades.find(imgObj => 'Default' in imgObj);
    return defaultMatch ? defaultMatch['Default'] : '';
  }

  /**
   * Selecciona una fecha y avanza al siguiente paso del proceso.
   *
   * @param {Date} date - La fecha que será seleccionada.
   * @return {void} No retorna ningún valor.
   */
  seleccionarFecha(date: Date): void {
    this.fechaSeleccionada = this.formatearFecha(date); // Store the selected date
    this.step += 1; // Move to the next step
  }

}
