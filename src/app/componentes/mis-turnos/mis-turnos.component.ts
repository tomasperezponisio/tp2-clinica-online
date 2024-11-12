import {Component, LOCALE_ID, OnInit} from '@angular/core';
import {Turno} from "../../models/turno";
import {TurnosService} from "../../services/turnos.service";
import {AuthService} from "../../services/auth.service";
import {FormsModule} from "@angular/forms";
import {DatePipe, NgClass, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {AlertService} from "../../services/alert.service";
import {registerLocaleData} from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr, 'es-AR');

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
  providers: [
    {provide: LOCALE_ID, useValue: 'es-AR'},
  ],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit {
  turnos: Turno[] = [];
  filteredTurnos: Turno[] = [];
  currentUser: any;
  userRole: string = ''; // 'paciente' or 'especialista'

  filterText: string = '';

  constructor(
    private turnosService: TurnosService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
  }

  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe(user => {
      this.currentUser = user;
      this.userRole = user.tipo; // 'paciente' or 'especialista'
      this.loadTurnos();
    });
  }

  loadTurnos() {
    if (this.userRole === 'paciente') {
      this.turnosService.traerTurnosPorUidDePaciente(this.currentUser.uid).subscribe(turnos => {
        this.turnos = turnos;
        this.applyFilter();
      });
    } else if (this.userRole === 'especialista') {
      this.turnosService.getTurnosByEspecialistaUid(this.currentUser.uid).subscribe(turnos => {
        this.turnos = turnos;
        this.applyFilter();
      });
    } else {
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
    console.log('Filter changed:' + this.filterText);
    this.applyFilter();
  }

  canCancelTurno(turno: Turno): boolean {
    return this.userRole === 'paciente' && turno.estado !== 'realizado' && turno.estado !== 'cancelado';
  }
  canVerResena(turno: Turno): boolean {
    return !!turno.reseña;
  }

  canCompletarEncuesta(turno: Turno): boolean {
    return turno.estado === 'realizado' && !!turno.reseña && !turno.encuesta;
  }

  canCalificarAtencion(turno: Turno): boolean {
    return turno.estado === 'realizado' && !turno.calificacion;
  }

  cancelarTurno(turno: Turno) {
    this.alertService.customPrompt('Cancelar Turno', 'Ingrese el motivo de la cancelación:')
      .then(result => {
        if (result.isConfirmed && result.value) {
          const motivo = result.value;
          turno.estado = 'cancelado';
          turno.comentarioPaciente = motivo;
          this.turnosService.updateTurno(turno).then(() => {
            this.alertService.customAlert(
              'Turno cancelado con éxito',
              `El turno fue cancelado por el paciente con el motivo: ${motivo}`,
              'success'
            );
          }).catch(error => {
            console.error('Error al cancelar el turno:', error);
            this.alertService.customAlert(
              'Error',
              'Hubo un error al cancelar el turno. Por favor, inténtelo de nuevo.',
              'error'
            );
          });
        } else if (result.isDismissed) {
          console.log('Prompt cancelado');
        }
      });
  }

  verResena(turno: Turno) {
    alert(`Reseña:\n${turno.reseña}`);
  }


  completarEncuesta(turno: Turno) {
    // TODO: implementar encuesta

    const respuesta1 = prompt('Pregunta 1: ¿Cómo calificaría la puntualidad del especialista?');
    const respuesta2 = prompt('Pregunta 2: ¿Está satisfecho con la atención recibida?');

    turno.encuesta = {
      respuesta1,
      respuesta2,
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
    const estadosNoPermitidos = ['aceptado', 'realizado', 'rechazado', 'cancelado'];
    return this.userRole === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  canRechazarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado'];
    return this.userRole === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  canAceptarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado', 'rechazado'];
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
    this.alertService.customPrompt('Rechazar Turno', 'Ingrese el motivo del rechazo:')
      .then(result => {
        if (result.isConfirmed && result.value) {
          const motivo = result.value;
          turno.estado = 'rechazado';
          turno.comentarioEspecialista = motivo;
          this.turnosService.updateTurno(turno).then(() => {
            this.alertService.customAlert(
              'Turno rechazado con éxito',
              `El turno ha sido rechazado con el motivo: ${motivo}`,
              'success'
            );
          }).catch(error => {
            console.error('Error al rechazar el turno:', error);
            this.alertService.customAlert(
              'Error',
              'Hubo un error al rechazar el turno. Por favor, inténtelo de nuevo.',
              'error'
            );
          });
        } else if (result.isDismissed) {
          console.log('Operación cancelada por el usuario.');
        }
      });  }

  aceptarTurno(turno: Turno) {
    this.alertService.customConfirm('Aceptar Turno', '¿Está seguro de aceptar este turno?')
      .then(result => {
        if (result.isConfirmed) {
          turno.estado = 'aceptado';
          this.turnosService.updateTurno(turno).then(() => {
            this.alertService.customAlert(
              'Turno aceptado con éxito',
              `El turno ha sido aceptado.`,
              'success'
            );
          }).catch(error => {
            console.error('Error al aceptar el turno:', error);
            this.alertService.customAlert(
              'Error',
              'Hubo un error al aceptar el turno. Por favor, inténtelo de nuevo.',
              'error'
            );
          });
        }
      });
  }

  finalizarTurno(turno: Turno) {
    this.alertService.customPrompt('Finalizar Turno', 'Ingrese la reseña y diagnóstico de la consulta:')
      .then(result => {
        if (result.isConfirmed && result.value) {
          const reseña = result.value;
          turno.estado = 'realizado';
          turno.reseña = reseña;
          this.turnosService.updateTurno(turno).then(() => {
            this.alertService.customAlert(
              'Turno finalizado con éxito',
              `El turno ha sido finalizado.`,
              'success'
            );
          }).catch(error => {
            console.error('Error al finalizar el turno:', error);
            this.alertService.customAlert(
              'Error',
              'Hubo un error al finalizar el turno. Por favor, inténtelo de nuevo.',
              'error'
            );
          });
        } else if (result.isDismissed) {
          console.log('Operación cancelada por el usuario.');
        }
      });  }

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
