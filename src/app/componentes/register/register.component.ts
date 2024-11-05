import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {AltaPacienteComponent} from "./componentes/alta-paciente/alta-paciente.component";
import {AltaEspecialistaComponent} from "./componentes/alta-especialista/alta-especialista.component";
import {AltaAdminComponent} from "./componentes/alta-admin/alta-admin.component";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    AltaPacienteComponent,
    AltaEspecialistaComponent,
    AltaAdminComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  formUsuario: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formUsuario = this.fb.group({
      tipoDeUsuario: ['paciente']
    });
  }

  get tipoDeUsuario() {
    const control = this.formUsuario.get('tipoDeUsuario');
    return control ? control.value : null;
  }
}
