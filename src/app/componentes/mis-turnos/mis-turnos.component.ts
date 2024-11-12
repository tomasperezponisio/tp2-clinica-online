import {Component, OnInit} from '@angular/core';
import {Turno} from "../../models/turno";
import {TurnosService} from "../../services/turnos.service";
import {AuthService} from "../../services/auth.service";
import {FormsModule} from "@angular/forms";
import {DatePipe, NgClass, NgForOf, NgIf, TitleCasePipe} from "@angular/common";

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    DatePipe,
    TitleCasePipe,
    NgIf,
    NgClass
  ],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit {
  turnos: Turno[] = [];
  filteredTurnos: Turno[] = [];
  currentUser: any;
  userRole: string = ''; // 'paciente' or 'especialista'

  // Filter text
  filterText: string = '';

  constructor(
    private turnosService: TurnosService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    // Get the current user
    this.authService.traerUsuarioActual().subscribe(user => {
      this.currentUser = user;
      this.userRole = user.tipo; // 'paciente' or 'especialista'
      this.loadTurnos();
    });
  }

  loadTurnos() {
    if (this.userRole === 'paciente') {
      // Fetch appointments for the current patient
      this.turnosService.traerTurnosPorUidDePaciente(this.currentUser.uid).subscribe(turnos => {
        this.turnos = turnos;
        this.applyFilter();
      });
    } else if (this.userRole === 'especialista') {
      // Fetch appointments for the current specialist
      this.turnosService.getTurnosByEspecialistaUid(this.currentUser.uid).subscribe(turnos => {
        this.turnos = turnos;
        this.applyFilter();
      });
    } else {
      // Handle other user roles if necessary
      this.turnos = [];
    }
  }

  applyFilter() {
    const searchText = this.filterText.toLowerCase();
    if (this.userRole === 'paciente') {
      this.filteredTurnos = this.turnos.filter(turno =>
        turno.especialidad.toLowerCase().includes(searchText) ||
        turno.especialistaNombre.toLowerCase().includes(searchText)
      );
    } else if (this.userRole === 'especialista') {
      this.filteredTurnos = this.turnos.filter(turno =>
        turno.especialidad.toLowerCase().includes(searchText) ||
        turno.pacienteNombre.toLowerCase().includes(searchText)
      );
    } else {
      this.filteredTurnos = [];
    }
  }

  onFilterChange() {
    this.applyFilter();
  }


// Methods for Paciente
  canCancelTurno(turno: Turno): boolean {
    return this.userRole === 'paciente' && turno.estado !== 'realizado' && turno.estado !== 'cancelado';
  }

// Determine if the review can be viewed
  canVerResena(turno: Turno): boolean {
    return !!turno.reseña;
  }

// Determine if the survey can be completed
  canCompletarEncuesta(turno: Turno): boolean {
    return turno.estado === 'realizado' && !!turno.reseña && !turno.encuesta;
  }

// Determine if the service can be rated
  canCalificarAtencion(turno: Turno): boolean {
    return turno.estado === 'realizado' && !turno.calificacion;
  }

  cancelarTurno(turno: Turno) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (motivo) {
      turno.estado = 'cancelado';
      turno.comentarioPaciente = motivo;
      this.turnosService.updateTurno(turno).then(() => {
        alert('Turno cancelado con éxito.');
      }).catch(error => {
        console.error('Error al cancelar el turno:', error);
      });
    }
  }

  verResena(turno: Turno) {
    alert(`Reseña:\n${turno.reseña}`);
  }


  completarEncuesta(turno: Turno) {
    // Implement your survey logic here.
    // For simplicity, we'll prompt the user for survey responses.

    const respuesta1 = prompt('Pregunta 1: ¿Cómo calificaría la puntualidad del especialista?');
    const respuesta2 = prompt('Pregunta 2: ¿Está satisfecho con la atención recibida?');
    // ... add more questions as needed

    turno.encuesta = {
      respuesta1,
      respuesta2,
      // ... other responses
    };

    this.turnosService.updateTurno(turno).then(() => {
      alert('Encuesta completada con éxito.');
    }).catch(error => {
      console.error('Error al completar la encuesta:', error);
    });
  }

  calificarAtencion(turno: Turno) {
    const calificacionStr = prompt('Califique la atención del especialista (1 a 5):');
    const comentario = prompt('Ingrese un comentario sobre la atención recibida:');
    const calificacion = parseInt(calificacionStr || '0', 10);

    if (calificacion >= 1 && calificacion <= 5) {
      turno.calificacion = calificacion;
      // @ts-ignore
      turno.comentarioPaciente = comentario;

      this.turnosService.updateTurno(turno).then(() => {
        alert('Gracias por calificar la atención.');
      }).catch(error => {
        console.error('Error al calificar la atención:', error);
      });
    } else {
      alert('Calificación inválida. Debe ser un número entre 1 y 5.');
    }
  }

  // Methods for Especialista
  canCancelarTurnoEsp(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'rechazado'];
    return this.userRole === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  canRechazarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado'];
    return this.userRole === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  canAceptarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['realizado', 'cancelado', 'rechazado'];
    return this.userRole === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  canFinalizarTurno(turno: Turno): boolean {
    return this.userRole === 'especialista' && turno.estado.toLowerCase() === 'aceptado';
  }

  cancelarTurnoEsp(turno: Turno) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (motivo) {
      turno.estado = 'cancelado';
      turno.comentarioEspecialista = motivo;
      this.turnosService.updateTurno(turno).then(() => {
        alert('Turno cancelado con éxito.');
      }).catch(error => {
        console.error('Error al cancelar el turno:', error);
      });
    }
  }

  rechazarTurno(turno: Turno) {
    // TODO: rechazar desde especialista
  }

  aceptarTurno(turno: Turno) {
    // TODO: aceptar desde especialista
  }

  finalizarTurno(turno: Turno) {
    // TODO: finalizar desde especialista
  }

  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'text-warning';
      case 'aceptado':
        return 'text-primary';
      case 'realizado':
        return 'text-success';
      case 'cancelado':
        return 'text-danger';
      case 'rechazado':
        return 'text-dark';
      default:
        return '';
    }
  }
}
