import {Component, OnInit} from '@angular/core';
import {Especialista} from "../../models/especialista";
import {Router} from "@angular/router";
import {UsuariosService} from "../../services/usuarios.service";
import {Bloque} from "../../models/bloque";
import {TurnosService} from "../../services/turnos.service";
import {Turno} from "../../models/turno";
import {AuthService} from "../../services/auth.service";
import {DatePipe, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {NgModule, LOCALE_ID} from '@angular/core';
import {registerLocaleData} from '@angular/common';
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

  // Selecciones
  especialidadSeleccionada: string = '';
  especialistaSeleccionado: Especialista | null = null;
  bloqueSeleccionado: Bloque | null = null;
  pacienteSeleccionado: any = null;

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
    const dates = dateStrings.map(dateStr => new Date(dateStr + 'T00:00:00')); // Ensure proper parsing
    return dates;
  }

  traerBloquesPorFecha(date: Date): Bloque[] {
    const dateStr = this.formatearFecha(date); // Convert Date object back to 'YYYY-MM-DD' string
    return this.bloquesDisponibles.filter(slot => slot.fecha === dateStr);
  }

  formatearFecha(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
