import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {AltaPacienteComponent} from "./componentes/alta-paciente/alta-paciente.component";
import {AltaEspecialistaComponent} from "./componentes/alta-especialista/alta-especialista.component";
import {AltaAdminComponent} from "./componentes/alta-admin/alta-admin.component";
import {Auth} from "@angular/fire/auth";

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
  tipoDeUsuario: string | null = null; // Initialize as null

  constructor(
    private fb: FormBuilder,
    public auth: Auth
  ) {
    this.formUsuario = this.fb.group({
      tipoDeUsuario: ['paciente']
    });
  }

  // get tipoDeUsuario() {
  //   const control = this.formUsuario.get('tipoDeUsuario');
  //   return control ? control.value : null;
  // }

  /**
   * Método para seleccionar el tipo de usuario.
   * @param tipo Tipo de usuario seleccionado ('paciente' o 'especialista').
   */
  selectUsuario(tipo: string): void {
    this.tipoDeUsuario = tipo;
  }
}
