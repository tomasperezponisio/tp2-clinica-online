import {Component, LOCALE_ID, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {TurnosService} from "../../services/turnos.service";
import {DatePipe, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {registerLocaleData} from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import {AlertService} from "../../services/alert.service";
import {Turno} from "../../models/turno";

registerLocaleData(localeEsAr, 'es-AR');

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    TitleCasePipe,
    DatePipe
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'es-AR'},
  ],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  pacientes: any[] = [];
  selectedPaciente: any | null = null; // Selected patient
  turnos: any[] = []; // Turnos of the selected patient
  usuarioActual: any;

  mostrarModalHistoriaClinica: boolean = false;
  selectedHistoriaClinica: any | null = null; // For the modal

  constructor(
    private authService: AuthService,
    private turnosService: TurnosService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe((user) => {
      this.usuarioActual = user;
      if (user.tipo === 'especialista') {
        this.cargarPacientes();
      }
    });
  }

  cargarPacientes(): void {
    this.turnosService.traerPacientesAtendidos(this.usuarioActual.uid).then((pacientes) => {
      this.pacientes = pacientes;
    });
  }

  seleccionarPaciente(paciente: any): void {
    this.selectedPaciente = paciente;
    this.turnosService.traerTurnosPorUidDePaciente(paciente.uid).subscribe((turnos) => {
      this.turnos = turnos.filter((turno) => turno.estado === 'realizado');
    });
  }

  verResena(turno: Turno) {
    if (turno.reseña != null) {
      this.alertService.customAlert('Reseña', turno.reseña, 'info');
    }
  }

  verHistoriaClinica(turno: any): void {
    this.selectedHistoriaClinica = turno.historiaClinica;
    this.mostrarModalHistoriaClinica = true; // Open the modal
  }

  cerrarModal(): void {
    this.mostrarModalHistoriaClinica = false;
    this.selectedHistoriaClinica = null;
  }
}
