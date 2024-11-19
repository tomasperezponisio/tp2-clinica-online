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

  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe(user => {
      this.usuarioActual = user;
      this.tipoDeUsuario = user.tipo; // Determine the user's role

      // If the user is an admin, fetch the list of pacientes
      if (this.tipoDeUsuario === 'admin') {
        this.traerPacientes();
        this.maxStep = 5; // Admins have an extra step
      }
    });

    this.traerEspecialidades();
  }

  traerPacientes() {
    this.usuariosService.traerPacientes().subscribe(pacientes => {
      this.pacientes = pacientes;
    });
  }

  elegirPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.step += 1; // Move to the next step
  }

  traerEspecialidades() {
    this.usuariosService.traerEspecialidades().subscribe(especialidades => {
      this.especialidades = especialidades;
    });
  }

  elegirEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.step += 1; // Move to the next step
    this.traerEspecialistas();
  }

  traerEspecialistas() {
    this.usuariosService.traerEspecialistasPorEspecialidad(this.especialidadSeleccionada).subscribe(especialistas => {
      this.especialistas = especialistas;
    });
  }

  elegirEspecialista(especialista: Especialista) {
    this.especialistaSeleccionado = especialista;
    this.step += 1; // Move to the next step
    this.traerBloquesDisponibles();
  }

  traerBloquesDisponibles() {
    if (this.especialistaSeleccionado && this.especialidadSeleccionada) {
      this.turnosService.generarBloquesDisponibles(this.especialistaSeleccionado, this.especialidadSeleccionada).then(slots => {
        this.bloquesDisponibles = slots;
      });
    }
  }

  seleccionarBloque(slot: Bloque) {
    this.bloqueSeleccionado = slot;
    this.step += 1; // Move to the next step
  }

  confirmarTurno() {
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

  resetSelections() {
    this.step = 1;
    this.especialidadSeleccionada = '';
    this.especialistaSeleccionado = null;
    this.bloqueSeleccionado = null;
    this.pacienteSeleccionado = null;
  }

  traerFechas(): Date[] {
    const dateStrings = Array.from(new Set(this.bloquesDisponibles.map(slot => slot.fecha)));
    return dateStrings.map(dateStr => new Date(dateStr + 'T00:00:00'));
  }

  traerBloquesPorFecha(date: string | Date | null): Bloque[] {
    if (!date) {
      return []; // Return an empty array if no date is provided
    }

    const dateStr = typeof date === 'string' ? date : this.formatearFecha(date); // Handle both types
    return this.bloquesDisponibles.filter(slot => slot.fecha === dateStr);
  }

  formatearFecha(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  traerImagenDeEspecialidad(especialidad: string): string {
    const lowerEspecialidad = especialidad.toLowerCase();
    const match = this.imagenesEspecialidades.find(imgObj => Object.keys(imgObj)[0].toLowerCase() === lowerEspecialidad);

    if (match) {
      return match[Object.keys(match)[0]]; // Return the matched image URL
    }

    const defaultMatch = this.imagenesEspecialidades.find(imgObj => 'Default' in imgObj);
    return defaultMatch ? defaultMatch['Default'] : '';
  }

  seleccionarFecha(date: Date): void {
    this.fechaSeleccionada = this.formatearFecha(date); // Store the selected date
    this.step += 1; // Move to the next step
  }

}
