import {Component, LOCALE_ID, OnInit} from '@angular/core';
import {Turno} from "../../models/turno";
import {TurnosService} from "../../services/turnos.service";
import {AuthService} from "../../services/auth.service";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {DatePipe, NgClass, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {AlertService} from "../../services/alert.service";
import {registerLocaleData} from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import {HighlightEstadoDirective} from "../../directivas/highlight.estado.directive";

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
    NgClass,
    ReactiveFormsModule,
    HighlightEstadoDirective
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'es-AR'},
  ],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  usuarioActual: any;
  tipoDeUsuario: string = ''; // 'paciente' or 'especialista'
  encuestaForm!: FormGroup;
  historiaClinicaForm!: FormGroup;
  showEncuestaForm: boolean = false;
  selectedTurno: Turno | null = null;
  showHistoriaClinicaForm: boolean = false;

  textoParaFiltrar: string = '';

  constructor(
    private turnosService: TurnosService,
    private authService: AuthService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe(user => {
      this.usuarioActual = user;
      this.tipoDeUsuario = user.tipo; // 'paciente', 'especialista', or 'admin'
      this.cargarTurnos();
    });

    // Inicializo el form de la encuesta
    this.encuestaForm = this.fb.group({
      puntualidad: ['', Validators.required],
      satisfaccion: ['', Validators.required]
    });

    // Inicializo el form de la historia clinica
    this.historiaClinicaForm = this.fb.group({
      altura: ['', [Validators.required, Validators.min(25), Validators.max(250)]],
      peso: ['', [Validators.required, Validators.min(1), Validators.max(300)]],
      temperatura: ['', [Validators.required, Validators.min(25), Validators.max(45)]],
      presion: ['', [Validators.required, Validators.pattern(/^\d+\/\d+$/)]],
      dinamicos: this.fb.array([]) // FormArray para los campos dinamicos
    });
  }

  cargarTurnos() {
    if (this.tipoDeUsuario === 'paciente') {
      this.turnosService.traerTurnosPorUidDePaciente(this.usuarioActual.uid).subscribe(turnos => {
        this.turnos = turnos;
        this.filtrar();
      });
    } else if (this.tipoDeUsuario === 'especialista') {
      this.turnosService.getTurnosByEspecialistaUid(this.usuarioActual.uid).subscribe(turnos => {
        this.turnos = turnos;
        this.filtrar();
      });
    } else if (this.tipoDeUsuario === 'admin') {
      this.turnosService.traerTodosLosTurnos().subscribe(turnos => {
        this.turnos = turnos;
        this.filtrar();
      });
    } else {
      this.turnos = [];
    }
  }

  filtrar() {
    const textoABuscar = this.textoParaFiltrar.toLowerCase();

    this.turnosFiltrados = this.turnos.filter(turno => {
      // Campos del turno
      const camposDelTurno =
        turno.especialidad.toLowerCase().includes(textoABuscar) ||
        turno.especialistaNombre.toLowerCase().includes(textoABuscar) ||
        turno.pacienteNombre?.toLowerCase().includes(textoABuscar) || // For especialistas or admins
        turno.fecha.includes(textoABuscar) ||
        turno.hora.includes(textoABuscar) ||
        turno.reseña?.toLowerCase().includes(textoABuscar) ||
        turno.estado.toLowerCase().includes(textoABuscar);

      // Campos de la historia clinica
      const camposDeHistoriaClinica = turno.historiaClinica &&
        (
          turno.historiaClinica.altura?.toString().includes(textoABuscar) ||
          turno.historiaClinica.peso?.toString().includes(textoABuscar) ||
          turno.historiaClinica.temperatura?.toString().includes(textoABuscar) ||
          turno.historiaClinica.presion?.toLowerCase().includes(textoABuscar)
        );

      // Campos dinamicos de la historia clinica
      const camposDinamicos = turno.historiaClinica?.dinamicos?.some(dato =>
        dato.key.toLowerCase().includes(textoABuscar) ||
        dato.value.toLowerCase().includes(textoABuscar)
      );

      // Combinacion de las tres busquedas anteriores
      return camposDelTurno || camposDeHistoriaClinica || camposDinamicos;
    });

    // Ordeno por fecha desc
    this.turnosFiltrados.sort((a, b) => {
      const dateA = this.parseDateTime(a.fecha, a.hora);
      const dateB = this.parseDateTime(b.fecha, b.hora);
      return dateA.getTime() - dateB.getTime(); // Ascending order
    });
  }


  parseDateTime(fecha: string, hora: string): Date {
    const dateTimeString = `${fecha} ${hora}`;
    const dateTime = new Date(dateTimeString);
    return dateTime;
  }

  alCambiarElFiltro() {
    console.log('Filtrando por:' + this.textoParaFiltrar);
    this.filtrar();
  }

  puedeCancelTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['realizado', 'cancelado', 'rechazado'];
    return this.tipoDeUsuario === 'paciente' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  puedeVerResena(turno: Turno): boolean {
    return turno.estado === 'realizado' || !!turno.reseña;
  }

  puedeCompletarEncuesta(turno: Turno): boolean {
    return turno.estado === 'realizado' && !!turno.reseña && !turno.encuesta;
  }

  puedeCalificarAtencion(turno: Turno): boolean {
    return turno.estado === 'realizado' && !turno.comentarioPaciente;
  }

  puedeCelarTurno(turno: Turno) {
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
    if (turno.reseña != null) {
      this.alertService.customAlert('Reseña', turno.reseña, 'info');
    }
  }

  completarEncuesta(turno: Turno): void {
    this.showEncuestaForm = true;
    this.selectedTurno = turno;
  }

  cancelEncuesta(): void {
    this.showEncuestaForm = false;
    this.selectedTurno = null;
    this.encuestaForm.reset();
  }

  submitEncuesta(turno: Turno | null): void {
    if (this.encuestaForm.valid && turno != null) {
      turno.encuesta = {
        respuesta1: this.encuestaForm.get('puntualidad')?.value,
        respuesta2: this.encuestaForm.get('satisfaccion')?.value,
      };

      this.turnosService.updateTurno(turno).then(() => {
        this.alertService.customAlert('Encuesta completada', 'Gracias por completar la encuesta.', 'success');
        this.showEncuestaForm = false;
        this.selectedTurno = null;
        this.encuestaForm.reset();
      }).catch(error => {
        console.error('Error al completar la encuesta:', error);
        this.alertService.customAlert('Error', 'Hubo un error al completar la encuesta. Por favor, inténtelo de nuevo.', 'error');
      });
    }
  }

  calificarAtencion(turno: Turno) {
    this.alertService.customPrompt('Califique la atención', 'Ingrese un comentario:').then(result => {
      if (result.isConfirmed && result.value) {
        const comentario = result.value;
        turno.comentarioPaciente = comentario;
        this.turnosService.updateTurno(turno).then(() => {
          this.alertService.customAlert(
            'Gracias por su comentario',
            'Gracias por calificar la atención.',
            'success'
          );
        }).catch(error => {
          console.error('Error al dejar comentario:', error);
          this.alertService.customAlert(
            'Error',
            'Hubo un error al dejar un comentario. Por favor, inténtelo de nuevo.',
            'error'
          );
        });
      } else if (result.isDismissed) {
        console.log('Operación cancelada por el usuario.');
      }
    });
  }

  // Methods for Especialista
  puedeCancelarTurnoEsp(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'rechazado', 'cancelado'];
    return this.tipoDeUsuario === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  puedeRechazarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'rechazado', 'cancelado'];
    return this.tipoDeUsuario === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  puedeAceptarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado', 'rechazado'];
    return this.tipoDeUsuario === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  puedeFinalizarTurno(turno: Turno): boolean {
    return this.tipoDeUsuario === 'especialista' && turno.estado.toLowerCase() === 'aceptado';
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
      });
  }

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
      });
  }

  get altura() {
    return this.historiaClinicaForm.get('altura');
  }

  get peso() {
    return this.historiaClinicaForm.get('peso');
  }

  get temperatura() {
    return this.historiaClinicaForm.get('temperatura');
  }

  get presion() {
    return this.historiaClinicaForm.get('presion');
  }

  // Dynamic fields
  dynamicFields: { key: string; value: string }[] = [];

  get dinamicos(): FormArray {
    return this.historiaClinicaForm.get('dinamicos') as FormArray;
  }

  agregarCampoDinamico(): void {
    if (this.dinamicos.length < 3) {
      this.dinamicos.push(this.fb.group({
        key: ['', Validators.required],
        value: ['', Validators.required]
      }));
    }
  }

  eliminarCampoDinamico(index: number): void {
    this.dinamicos.removeAt(index);
  }

  abrirModalHistoriaClinica(turno: Turno): void {
    this.selectedTurno = turno;
    this.showHistoriaClinicaForm = true;
    this.historiaClinicaForm.reset(); // Clear the form
    this.dynamicFields = []; // Reset dynamic fields
  }

  cerrarModalHistoriaClinica(): void {
    this.selectedTurno = null;
    this.showHistoriaClinicaForm = false;
  }

  submitHistoriaClinica(): void {
    if (!this.selectedTurno || this.historiaClinicaForm.invalid) return;

    // Combine fixed and dynamic fields
    const historiaClinica = {
      ...this.historiaClinicaForm.value,
      dinamicos: this.dinamicos.value // Retrieve dynamic fields from the FormArray
    };

    console.log('historiaClinica', historiaClinica);

    // Save historiaClinica in the selected turno
    this.selectedTurno.historiaClinica = historiaClinica;

    // Update the turno in the database
    this.turnosService.updateTurno(this.selectedTurno).then(() => {
      this.alertService.customAlert(
        'Historia Clínica Guardada',
        'La historia clínica se ha guardado con éxito.',
        'success'
      );
      this.cerrarModalHistoriaClinica(); // Close modal
    }).catch(error => {
      console.error('Error al guardar la historia clínica:', error);
      this.alertService.customAlert(
        'Error',
        'Hubo un error al guardar la historia clínica. Por favor, inténtelo nuevamente.',
        'error'
      );
    });
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

  getFilterPlaceholder(): string {
    if (this.tipoDeUsuario === 'paciente') {
      return 'Filtrar por especialidad o especialista';
    } else if (this.tipoDeUsuario === 'especialista') {
      return 'Filtrar por especialidad o paciente';
    } else if (this.tipoDeUsuario === 'admin') {
      return 'Filtrar por especialidad, paciente o especialista';
    } else {
      return 'Filtrar';
    }
  }

  puedeCancelarTurnoAdmin(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado', 'rechazado'];
    return this.tipoDeUsuario === 'admin' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  cancelarTurnoAdmin(turno: Turno) {
    this.alertService.customPrompt('Cancelar Turno', 'Ingrese el motivo de la cancelación:')
      .then(result => {
        if (result.isConfirmed && result.value) {
          const motivo = result.value;
          turno.estado = 'cancelado';
          turno.comentarioAdmin = motivo; // Assuming you have this field
          this.turnosService.updateTurno(turno).then(() => {
            this.alertService.customAlert(
              'Turno cancelado con éxito',
              `El turno fue cancelado por el administrador con el motivo: ${motivo}`,
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
          console.log('Operación cancelada por el usuario.');
        }
      });
  }
}
