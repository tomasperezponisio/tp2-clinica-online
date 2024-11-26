import {Component, Input, OnInit} from '@angular/core';
import {Disponibilidad, Especialista} from "../../../../models/especialista";
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {UsuariosService} from "../../../../services/usuarios.service";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {AlertService} from "../../../../services/alert.service";

@Component({
  selector: 'app-mis-horarios',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf,
    NgClass,
    NgIf
  ],
  templateUrl: './mis-horarios.component.html',
  styleUrl: './mis-horarios.component.css'
})
export class MisHorariosComponent implements OnInit {
  @Input() especialista!: Especialista;
  horarioForm!: FormGroup;

  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  horasDisponibles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
  ) {}

  /**
   * Método de ciclo de vida de Angular que se ejecuta una vez que se inicializa el componente.
   * Inicializa la lista de disponibilidad del especialista si no está definida.
   * Configura el formulario de horario.
   * Inicia las disponibilidades del especialista.
   * Genera las horas disponibles entre las 8:00 y las 19:00.
   *
   * @return {void} No devuelve ningún valor.
   */
  ngOnInit(): void {
    // Initialize disponibilidad if it's undefined
    if (!this.especialista.disponibilidad) {
      this.especialista.disponibilidad = [];
    }

    this.horarioForm = this.fb.group({
      disponibilidades: this.fb.array([]),
    });

    this.iniciarDisponibilidades();

    this.horasDisponibles = this.generarHoras(8, 19);

  }

  /**
   * Genera una lista de horas en formato de cadena, en un rango especificado.
   *
   * @param {number} start - La hora de inicio del rango (inclusive).
   * @param {number} end - La hora de fin del rango (inclusive).
   * @return {string[]} Una lista de horas en formato "HH:00".
   */
  generarHoras(start: number, end: number): string[] {
    const hours = [];
    for (let i = start; i <= end; i++) {
      hours.push(i.toString().padStart(2, '0') + ':00');
    }
    return hours;
  }

  /**
   * Inicializa las disponibilidades del especialista basándose en su especialidad.
   * Este método actualiza un FormArray con varias estructuras de formulario para cada especialidad,
   * incorporando los días, horarios de inicio y fin, y duración del turno, todos provenientes del objeto especialista.
   * Si ya existen disponibilidades previamente almacenadas para alguna especialidad, estos valores son incluidos.
   * Adiciona validadores específicos para los horarios de la clínica.
   *
   * @return {void} No retorna ningún valor.
   */
  iniciarDisponibilidades(): void {
    const disponibilidades = this.horarioForm.get('disponibilidades') as FormArray;

    this.especialista.especialidad.forEach((esp) => {

      const existingDisp = (this.especialista.disponibilidad || []).find(d => d.especialidad === esp);

      disponibilidades.push(
        this.fb.group({
          especialidad: [esp],
          dias: this.buildDiasFormArray(existingDisp?.dias || []),
          horarioInicio: [existingDisp?.horarioInicio || '', Validators.required],
          horarioFin: [existingDisp?.horarioFin || '', Validators.required],
          duracionTurno: [existingDisp?.duracionTurno || 30, [Validators.required, Validators.min(30)]],
        }, { validators: this.validarHorariosDeLaClinica.bind(this) })
      );
    });
  }

  /**
   * Construye un FormArray de los días de la semana con base en los días seleccionados.
   *
   * @param {string[]} selectedDias - Arreglo de cadenas que representan los días seleccionados.
   * @return {FormArray} FormArray donde cada control indica si el día correspondiente ha sido seleccionado.
   */
  buildDiasFormArray(selectedDias: string[]): FormArray {
    const arr = this.diasSemana.map(dia => {
      return this.fb.control(selectedDias.includes(dia));
    });
    return this.fb.array(arr);
  }

  /**
   * Obtiene el array de formularios para las disponibilidades del horario.
   *
   * @return {FormArray} El array de formularios asociado a las disponibilidades del horario.
   */
  get disponibilidades(): FormArray {
    return this.horarioForm.get('disponibilidades') as FormArray;
  }

  /**
   * Obtiene el FormArray de días a partir de un índice específico en el array de disponibilidades.
   *
   * @param {number} index - El índice del array de disponibilidades del cual se desea obtener el FormArray de días.
   * @return {FormArray} - El FormArray de días correspondiente al índice especificado.
   */
  getDiasFormArray(index: number): FormArray {
    return this.disponibilidades.at(index).get('dias') as FormArray;
  }

  /**
   * Guarda los horarios de disponibilidad del especialista y actualiza la información del usuario.
   *
   * Este método recorre los controles de disponibilidad y asigna los valores seleccionados a un objeto
   * que luego se guardará en el atributo `disponibilidad` del especialista. Finalmente, se actualiza
   * la información del usuario y se maneja el resultado de forma apropiada.
   *
   * @return {void} No retorna ningún valor.
   */
  guardarHorarios(): void {
    const disponibilidadData: Disponibilidad[] = this.disponibilidades.controls.map((group, i) => {
      const diasControlArray = group.get('dias') as FormArray;
      const selectedDias = diasControlArray.controls
        .map((control, index) => control.value ? this.diasSemana[index] : null)
        .filter(value => value !== null);

      return {
        especialidad: group.get('especialidad')?.value,
        dias: selectedDias,
        horarioInicio: group.get('horarioInicio')?.value,
        horarioFin: group.get('horarioFin')?.value,
        duracionTurno: group.get('duracionTurno')?.value,
      };
    });

    this.especialista.disponibilidad = disponibilidadData;

    console.log('Disponibilidad: ', disponibilidadData);

    this.usuariosService.actualizarDataDeUsuario({ disponibilidad: disponibilidadData })
      .then(() => {
        this.alertService.customAlert('Disponibilidad actualizada con éxito.', '', 'success');
      })
      .catch((error) => {
        console.error('Error al actualizar la disponibilidad:', error);
      });
  }

  /**
   * Valida que el horario de inicio sea anterior al horario de fin.
   *
   * @param {FormGroup} group - El formulario que contiene los campos de horario de inicio y horario de fin.
   * @return {null|{invalidTimeRange: true}} - Retorna un objeto con la propiedad `invalidTimeRange: true` si el horario de inicio es mayor o igual al horario de fin, de lo contrario retorna null.
   */
  validarHorariosDeLaClinica(group: FormGroup): null | { invalidTimeRange: true } {
    const horarioInicio = group.get('horarioInicio')?.value;
    const horarioFin = group.get('horarioFin')?.value;

    if (horarioInicio && horarioFin && horarioInicio >= horarioFin) {
      group.get('horarioInicio')?.setErrors({ invalidTimeRange: true });
      group.get('horarioFin')?.setErrors({ invalidTimeRange: true });
      return { invalidTimeRange: true };
    } else {
      group.get('horarioInicio')?.setErrors(null);
      group.get('horarioFin')?.setErrors(null);
      return null;
    }
  }

}
