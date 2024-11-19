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

  generarHoras(start: number, end: number): string[] {
    const hours = [];
    for (let i = start; i <= end; i++) {
      hours.push(i.toString().padStart(2, '0') + ':00');
    }
    return hours;
  }

  iniciarDisponibilidades() {
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

  buildDiasFormArray(selectedDias: string[]): FormArray {
    const arr = this.diasSemana.map(dia => {
      return this.fb.control(selectedDias.includes(dia));
    });
    return this.fb.array(arr);
  }

  get disponibilidades(): FormArray {
    return this.horarioForm.get('disponibilidades') as FormArray;
  }

  getDiasFormArray(index: number): FormArray {
    return this.disponibilidades.at(index).get('dias') as FormArray;
  }

  getDiaLabel(index: number): string {
    return this.diasSemana[index];
  }

  guardarHorarios() {
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

  validarHorariosDeLaClinica(group: FormGroup) {
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
