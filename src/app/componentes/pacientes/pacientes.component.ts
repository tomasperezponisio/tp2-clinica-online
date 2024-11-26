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

  /**
   * Método que se ejecuta al inicializar el componente.
   * Trae el usuario actual utilizando el authService y lo asigna a la variable usuarioActual.
   * Si el tipo de usuario es 'especialista', se llama al método cargarPacientes.
   * @return {void} No retorna ningún valor.
   */
  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe((user) => {
      this.usuarioActual = user;
      if (user.tipo === 'especialista') {
        this.cargarPacientes();
      }
    });
  }

  /**
   * Carga la lista de pacientes atendidos por el usuario actual.
   * Obtiene los datos a través del servicio turnosService y actualiza la propiedad pacientes.
   *
   * @return {void} No retorna ningún valor.
   */
  cargarPacientes(): void {
    this.turnosService.traerPacientesAtendidos(this.usuarioActual.uid).then((pacientes) => {
      this.pacientes = pacientes;
    });
  }

  /**
   * Selecciona un paciente y obtiene sus turnos realizados.
   *
   * @param {any} paciente - El paciente seleccionado, debe contener un UID.
   * @return {void}
   */
  seleccionarPaciente(paciente: any): void {
    this.selectedPaciente = paciente;
    this.turnosService.traerTurnosPorUidDePaciente(paciente.uid).subscribe((turnos) => {
      this.turnos = turnos.filter((turno) => turno.estado === 'realizado');
    });
  }

  /**
   * Muestra una alerta con la reseña del turno si esta está disponible.
   *
   * @param {Turno} turno - El turno del cual se desea ver la reseña.
   * @return {void}
   */
  verResena(turno: Turno): void {
    if (turno.reseña != null) {
      this.alertService.customAlert('Reseña', turno.reseña, 'info');
    }
  }

  /**
   * Muestra la historia clínica de un turno seleccionado en un modal.
   *
   * @param {any} turno - El turno del cual se extraerá y mostrará la historia clínica.
   * @return {void} No devuelve ningún valor.
   */
  verHistoriaClinica(turno: any): void {
    this.selectedHistoriaClinica = turno.historiaClinica;
    this.mostrarModalHistoriaClinica = true; // Open the modal
  }

  /**
   * Cierra el modal de la historia clínica.
   *
   * Este método establece la propiedad `mostrarModalHistoriaClinica` a `false`
   * y reinicia la propiedad `selectedHistoriaClinica` a `null`.
   *
   * @return {void} No retorna ningún valor.
   */
  cerrarModal(): void {
    this.mostrarModalHistoriaClinica = false;
    this.selectedHistoriaClinica = null;
  }
}
