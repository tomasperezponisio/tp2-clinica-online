import {Component, LOCALE_ID, OnInit} from '@angular/core';
import {Turno} from "../../models/turno";
import {TurnosService} from "../../services/turnos.service";
import {AuthService} from "../../services/auth.service";
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {DatePipe, NgClass, NgForOf, NgIf, registerLocaleData, TitleCasePipe} from "@angular/common";
import {AlertService} from "../../services/alert.service";
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

  /**
   * Método del ciclo de vida de Angular que se ejecuta una vez que el componente ha sido inicializado.
   *
   * @return {void} No retorna valor.
   */
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

  /**
   * Carga los turnos correspondientes al usuario actual basado en su tipo.
   * Llama al servicio apropiado para obtener los turnos y luego aplica un filtro.
   *
   * @return {void} No retorna ningún valor.
   */
  cargarTurnos(): void {
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

  /**
   * Filtra los turnos en función del texto proporcionado.
   * Realiza la búsqueda en diferentes campos del turno y de la historia clínica
   * para encontrar coincidencias parciales o completas con el texto.
   * Ordena los resultados por fecha de manera ascendente.
   *
   * @return {void} No retorna un valor, pero actualiza la propiedad `turnosFiltrados` con los resultados.
   */
  filtrar(): void {
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


  /**
   * Convierte una fecha y una hora en una instancia de Date.
   *
   * @param {string} fecha - La fecha en formato 'yyyy-mm-dd'.
   * @param {string} hora - La hora en formato 'hh:mm:ss'.
   * @return {Date} Una instancia de Date que representa la fecha y hora combinadas.
   */
  parseDateTime(fecha: string, hora: string): Date {
    const dateTimeString = `${fecha} ${hora}`;
    return new Date(dateTimeString);
  }

  /**
   * Método invocado al cambiar el filtro.
   * Este método registra en la consola el texto utilizado para filtrar
   * y luego aplica el filtro correspondiente llamando al método filtrar().
   *
   * @return {void}
   */
  alCambiarElFiltro(): void {
    console.log('Filtrando por:' + this.textoParaFiltrar);
    this.filtrar();
  }

  /**
   * Verifica si el turno puede ser cancelado.
   *
   * @param {Turno} turno - El turno que se desea evaluar.
   * @return {boolean} - Devuelve verdadero si el usuario es un paciente y el estado del turno
   * no es 'realizado', 'cancelado' o 'rechazado'. De lo contrario, devuelve falso.
   */
  puedeCancelTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['realizado', 'cancelado', 'rechazado'];
    return this.tipoDeUsuario === 'paciente' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  /**
   * Determina si se puede ver la reseña de un turno específico.
   *
   * @param {Turno} turno - El objeto Turno en cuestión.
   * @return {boolean} - Retorna true si el estado del turno es 'realizado'
   *                     o si ya existe una reseña, de lo contrario retorna false.
   */
  puedeVerResena(turno: Turno): boolean {
    return turno.estado === 'realizado' || !!turno.reseña;
  }

  /**
   * Verifica si se puede completar la encuesta para un turno dado.
   *
   * @param {Turno} turno - El objeto que representa un turno, que contiene información
   *                        sobre su estado, reseña y encuesta.
   * @return {boolean} - Retorna true si el turno tiene el estado 'realizado',
   *                     tiene una reseña y no tiene una encuesta ya completada,
   *                     de lo contrario retorna false.
   */
  puedeCompletarEncuesta(turno: Turno): boolean {
    return turno.estado === 'realizado' && !!turno.reseña && !turno.encuesta;
  }

  /**
   * Verifica si un paciente puede calificar la atención recibida en un turno.
   *
   * @param {Turno} turno - El objeto turno que contiene la información del estado y comentarios.
   * @return {boolean} - Devuelve true si el turno está en estado 'realizado' y no tiene comentarios del paciente, de lo contrario devuelve false.
   */
  puedeCalificarAtencion(turno: Turno): boolean {
    return turno.estado === 'realizado' && !turno.comentarioPaciente;
  }

  /**
   * Maneja la cancelación de un turno, solicitando el motivo al usuario y
   * actualizando el estado del turno si es confirmado.
   *
   * @param {Turno} turno - El objeto turno que se desea cancelar.
   * @return {void} No devuelve un valor, pero realiza operaciones de actualización y alertas.
   */
  puedeCelarTurno(turno: Turno): void {
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

  /**
   * Muestra una reseña asociada a un turno si existe.
   *
   * @param {Turno} turno - Objeto que representa el turno del cual se va a mostrar la reseña.
   * @return {void}
   */
  verResena(turno: Turno): void {
    if (turno.reseña != null) {
      this.alertService.customAlert('Reseña', turno.reseña, 'info');
    }
  }

  /**
   * Activa el formulario de encuesta y establece el turno seleccionado.
   *
   * @param {Turno} turno - El turno que será evaluado en la encuesta.
   * @return {void} No retorna ningún valor.
   */
  completarEncuesta(turno: Turno): void {
    this.showEncuestaForm = true;
    this.selectedTurno = turno;
  }

  /**
   * Cancela la encuesta en curso y restablece el formulario a su estado inicial.
   *
   * @return {void} No retorna ningún valor.
   */
  cancelEncuesta(): void {
    this.showEncuestaForm = false;
    this.selectedTurno = null;
    this.encuestaForm.reset();
  }

  /**
   * Envía la encuesta asociada al turno si el formulario es válido y el turno no es nulo.
   *
   * @param {Turno | null} turno - El turno al que se asocia la encuesta. Puede ser nulo.
   * @return {void} - No retorna un valor.
   */
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

  /**
   * Solicita al usuario que califique la atención recibida y actualiza el turno con el comentario ingresado.
   *
   * @param {Turno} turno - El turno que será actualizado con el comentario ingresado por el paciente.
   * @return {void} No retorna un valor.
   */
  calificarAtencion(turno: Turno): void {
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
  /**
   * Verifica si un especialista puede cancelar un turno basado en el estado del mismo.
   *
   * @param {Turno} turno - El turno que se desea evaluar.
   * @return {boolean} Devuelve true si el especialista puede cancelar el turno, false en caso contrario.
   */
  puedeCancelarTurnoEsp(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'rechazado', 'cancelado'];
    return this.tipoDeUsuario === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  /**
   * Verifica si un especialista puede rechazar un turno dado basado en el estado del turno.
   *
   * @param {Turno} turno - El objeto del turno que se quiere evaluar.
   * @return {boolean} - Retorna `true` si el especialista puede rechazar el turno, de lo contrario `false`.
   */
  puedeRechazarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'rechazado', 'cancelado'];
    return this.tipoDeUsuario === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  /**
   * Verifica si un turno puede ser aceptado por el usuario.
   *
   * @param {Turno} turno - El turno que se evalúa.
   * @return {boolean} - Devuelve true si el usuario es especialista y el estado del turno no está en una lista de estados no permitidos. Devuelve false en caso contrario.
   */
  puedeAceptarTurno(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado', 'rechazado'];
    return this.tipoDeUsuario === 'especialista' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  /**
   * Verifica si un usuario puede finalizar un turno.
   *
   * @param {Turno} turno - El turno que se quiere finalizar.
   * @return {boolean} - Retorna `true` si el usuario es un especialista y el estado del turno es "aceptado", de lo contrario retorna `false`.
   */
  puedeFinalizarTurno(turno: Turno): boolean {
    return this.tipoDeUsuario === 'especialista' && turno.estado.toLowerCase() === 'aceptado';
  }

  /**
   * Cancela un turno específico asignado a un especialista.
   *
   * @param {Turno} turno - El objeto turno que será cancelado.
   * @return {void}
   */
  cancelarTurnoEsp(turno: Turno): void {
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

  /**
   * Rechaza un turno solicitando un motivo al usuario.
   *
   * @param {Turno} turno - Objeto del turno que se va a rechazar.
   *
   * @return {void} No retorna ningún valor.
   */
  rechazarTurno(turno: Turno): void {
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

  /**
   * Acepta un turno después de una confirmación por parte del usuario.
   *
   * @param {Turno} turno - El turno que se desea aceptar.
   * @return {void} No retorna ningún valor.
   */
  aceptarTurno(turno: Turno): void {
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

  /**
   * Finaliza un turno actualizando su estado y añadiendo una reseña y diagnóstico.
   * Muestra un cuadro de diálogo personalizado para que el usuario ingrese la reseña y diagnóstico.
   * Si el usuario confirma la acción, se actualiza el turno y se notifica el éxito.
   * Si hay un error en la actualización, se notifica el error.
   *
   * @param {Turno} turno - El turno que se va a finalizar.
   * @return {void} No retorna un valor.
   */
  finalizarTurno(turno: Turno): void {
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

  /**
   * Agrega un campo dinámico a la lista 'dinamicos' si aún no se han añadido tres.
   *
   * @return {void} No devuelve ningún valor.
   */
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

  /**
   * Abre el modal para la historia clínica y establece el turno seleccionado.
   * Reinicia el formulario de la historia clínica y los campos dinámicos.
   *
   * @param {Turno} turno - El turno seleccionado que se mostrará en el modal.
   * @return {void} No retorna ningún valor.
   */
  abrirModalHistoriaClinica(turno: Turno): void {
    this.selectedTurno = turno;
    this.showHistoriaClinicaForm = true;
    this.historiaClinicaForm.reset(); // Clear the form
    this.dynamicFields = []; // Reset dynamic fields
  }

  /**
   * Cierra el modal de la historia clínica.
   *
   * Este método realiza las siguientes acciones:
   * - Restablece la propiedad `selectedTurno` a `null`.
   * - Desactiva el formulario de historia clínica estableciendo
   *   la propiedad `showHistoriaClinicaForm` a `false`.
   *
   * @return {void} No retorna ningún valor.
   */
  cerrarModalHistoriaClinica(): void {
    this.selectedTurno = null;
    this.showHistoriaClinicaForm = false;
  }

  /**
   * Guarda la historia clínica del turno seleccionado en la base de datos.
   *
   * Combina los campos fijos del formulario con los campos dinámicos
   * y guarda la historia clínica en el turno seleccionado.
   *
   * @return {void} No devuelve ningún valor.
   */
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

  /**
   * Devuelve la clase CSS correspondiente al estado proporcionado.
   *
   * @param {string} estado - El estado del objeto.
   * @return {string} La clase CSS que corresponde al estado.
   */
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

  /**
   * Devuelve el texto del marcador de posición (placeholder) para el filtro según el tipo de usuario.
   *
   * @return {string} El marcador de posición apropiado para el filtro basado en el tipo de usuario.
   */
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

  /**
   * Verifica si un administrador puede cancelar un turno dado su estado actual.
   *
   * @param {Turno} turno - El turno que se desea evaluar.
   * @return {boolean} Devuelve true si el administrador puede cancelar el turno, de lo contrario false.
   */
  puedeCancelarTurnoAdmin(turno: Turno): boolean {
    const estadosNoPermitidos = ['aceptado', 'realizado', 'cancelado', 'rechazado'];
    return this.tipoDeUsuario === 'admin' && !estadosNoPermitidos.includes(turno.estado.toLowerCase());
  }

  /**
   * Cancela un turno administrativamente solicitando un motivo al usuario.
   *
   * @param {Turno} turno - El turno a cancelar.
   * @return {void} No retorna un valor.
   */
  cancelarTurnoAdmin(turno: Turno): void {
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
