import {Component, OnInit} from '@angular/core';
import {Especialista} from "../../models/especialista";
import {Router} from "@angular/router";
import {UsuariosService} from "../../services/usuarios.service";
import {Bloque} from "../../models/bloque";
import {TurnosService} from "../../services/turnos.service";
import {Turno} from "../../models/turno";
import {AuthService} from "../../services/auth.service";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import Swal from "sweetalert2";
import {NgModule, LOCALE_ID} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr, 'es-AR');

@Component({
  selector: 'app-solicitar-turnos',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    DatePipe,
  ],
  providers: [
    // Set the LOCALE_ID to 'es-AR' for the entire application
    {provide: LOCALE_ID, useValue: 'es-AR'},
  ],
  templateUrl: './solicitar-turnos.component.html',
  styleUrl: './solicitar-turnos.component.css'
})
export class SolicitarTurnosComponent implements OnInit {
  // Step tracker
  step: number = 1;

  // Data holders
  especialidades: string[] = [];
  especialistas: Especialista[] = [];
  availableSlots: Bloque[] = [];

  // Selections
  especialidadSeleccionada: string = '';
  especialistaSeleccionado: Especialista | null = null;
  bloqueSeleccionado: Bloque | null = null;

  // Current User
  usuarioActual: any;

  constructor(
    private usuariosService: UsuariosService,
    private turnosService: TurnosService,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Get the current user
    this.authService.traerUsuarioActual().subscribe(user => {
      this.usuarioActual = user;
    });

    // Fetch the list of specialties
    this.traerEspecialidades();
  }

  traerEspecialidades() {
    this.usuariosService.traerEspecialidades().subscribe(especialidades => {
      this.especialidades = especialidades;
    });
  }

  elegirEspecialidad(especialidad: string) {
    this.especialidadSeleccionada = especialidad;
    this.step = 2;
    this.traerEspecialistas();
  }

  traerEspecialistas() {
    this.usuariosService.traerEspecialistasPorEspecialidad(this.especialidadSeleccionada).subscribe(especialistas => {
      this.especialistas = especialistas;
    });
  }

  elegirEspecialista(especialista: Especialista) {
    this.especialistaSeleccionado = especialista;
    this.step = 3;
    this.traerBloquesDisponibles();
  }

  traerBloquesDisponibles() {
    if (this.especialistaSeleccionado && this.especialidadSeleccionada) {
      this.turnosService.generarBloquesDisponibles(this.especialistaSeleccionado, this.especialidadSeleccionada).then(slots => {
        this.availableSlots = slots;
      });
    }
  }

  seleccionarBloque(slot: Bloque) {
    this.bloqueSeleccionado = slot;
    this.step = 4;
  }

  confirmarTurno() {
    if (this.usuarioActual && this.especialistaSeleccionado && this.especialidadSeleccionada && this.bloqueSeleccionado) {
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
        this.showSuccessAlert(`Turno reservado para el ${this.bloqueSeleccionado.fecha} a las ${this.bloqueSeleccionado.hora}`).then(() => {
          // Reset selections or navigate away
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
  }

  // Helper methods for displaying slots
  traerFechas(): Date[] {
    const dateStrings = Array.from(new Set(this.availableSlots.map(slot => slot.fecha)));
    const dates = dateStrings.map(dateStr => new Date(dateStr + 'T00:00:00')); // Ensure proper parsing
    return dates;
  }

// solicitar-turnos.component.ts
  traerBloquesPorFecha(date: Date): Bloque[] {
    const dateStr = this.formatearFecha(date); // Convert Date object back to 'YYYY-MM-DD' string
    return this.availableSlots.filter(slot => slot.fecha === dateStr);
  }

  formatearFecha(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toTitleCase(str: string | null) {
    // @ts-ignore
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

  private showSuccessAlert(message: string) {
    return Swal.fire({
      title: 'Turno reservado con éxito!',
      text: message,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }
}
