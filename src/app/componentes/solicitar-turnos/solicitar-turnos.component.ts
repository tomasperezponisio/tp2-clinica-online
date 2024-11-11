import {Component, OnInit} from '@angular/core';
import {Especialista} from "../../models/especialista";
import {Router} from "@angular/router";
import {UsuariosService} from "../../services/usuarios.service";
import {Slot} from "../../models/slot";
import {TurnosService} from "../../services/turnos.service";
import {Turno} from "../../models/turno";
import {AuthService} from "../../services/auth.service";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import Swal from "sweetalert2";
import { NgModule, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
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
    { provide: LOCALE_ID, useValue: 'es-AR' },
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
  availableSlots: Slot[] = [];

  // Selections
  selectedEspecialidad: string = '';
  selectedEspecialista: Especialista | null = null;
  selectedSlot: Slot | null = null;

  // Current User
  currentUser: any;

  constructor(
    private usuariosService: UsuariosService,
    private turnosService: TurnosService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get the current user
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    // Fetch the list of specialties
    this.fetchEspecialidades();
  }

  fetchEspecialidades() {
    this.usuariosService.getEspecialidades().subscribe(especialidades => {
      this.especialidades = especialidades;
    });
  }

  selectEspecialidad(especialidad: string) {
    this.selectedEspecialidad = especialidad;
    this.step = 2;
    this.fetchEspecialistas();
  }

  fetchEspecialistas() {
    this.usuariosService.getEspecialistasByEspecialidad(this.selectedEspecialidad).subscribe(especialistas => {
      this.especialistas = especialistas;
    });
  }

  selectEspecialista(especialista: Especialista) {
    this.selectedEspecialista = especialista;
    this.step = 3;
    this.fetchAvailableSlots();
  }

  fetchAvailableSlots() {
    if (this.selectedEspecialista && this.selectedEspecialidad) {
      this.turnosService.generateAvailableSlots(this.selectedEspecialista, this.selectedEspecialidad).then(slots => {
        this.availableSlots = slots;
      });
    }
  }

  selectSlot(slot: Slot) {
    this.selectedSlot = slot;
    this.step = 4;
  }

  confirmAppointment() {
    if (this.currentUser && this.selectedEspecialista && this.selectedEspecialidad && this.selectedSlot) {
      const turno: Turno = {
        pacienteUid: this.currentUser.uid,
        pacienteNombre: `${this.currentUser.nombre} ${this.currentUser.apellido}`,
        especialistaUid: this.selectedEspecialista.uid,
        especialistaNombre: `${this.selectedEspecialista.nombre} ${this.selectedEspecialista.apellido}`,
        especialidad: this.selectedEspecialidad,
        fecha: this.selectedSlot.fecha,
        hora: this.selectedSlot.hora,
        estado: 'pendiente',
      };

      this.turnosService.solicitarTurno(turno).then(() => {
        // @ts-ignore
        this.showSuccessAlert(`Turno reservado para el ${this.selectedSlot.fecha} a las ${this.selectedSlot.hora}`).then(() => {
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
    this.selectedEspecialidad = '';
    this.selectedEspecialista = null;
    this.selectedSlot = null;
  }

  // Helper methods for displaying slots
  getDates(): Date[] {
    const dateStrings = Array.from(new Set(this.availableSlots.map(slot => slot.fecha)));
    const dates = dateStrings.map(dateStr => new Date(dateStr + 'T00:00:00')); // Ensure proper parsing
    return dates;
  }

// solicitar-turnos.component.ts
  getSlotsForDate(date: Date): Slot[] {
    const dateStr = this.formatDate(date); // Convert Date object back to 'YYYY-MM-DD' string
    return this.availableSlots.filter(slot => slot.fecha === dateStr);
  }

  formatDate(date: Date): string {
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
