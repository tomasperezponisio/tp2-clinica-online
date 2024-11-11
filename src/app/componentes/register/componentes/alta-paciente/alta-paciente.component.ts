import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import Swal from "sweetalert2";
import {LoginService} from "../../../../services/login.service";
import {Paciente} from "../../../../models/paciente";
import {passwordValidator} from "../../../../validadores/password.validator";
import {Storage, ref, uploadBytes, getDownloadURL} from '@angular/fire/storage';

@Component({
  selector: 'app-alta-paciente',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './alta-paciente.component.html',
  styleUrl: './alta-paciente.component.css'
})
export class AltaPacienteComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private loginService: LoginService,
    private storage: Storage
  ) {
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      nombre: new FormControl("", [
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚ\\s]+$'),
        Validators.required
      ]),
      apellido: new FormControl("", [
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚ\\s]+$'),
        Validators.required
      ]),
      edad: new FormControl("", [
        Validators.min(18),
        Validators.max(65),
        Validators.required
      ]),
      dni: new FormControl("", [
        Validators.pattern('^[0-9]{8}$'),
        Validators.required
      ]),
      obraSocial: new FormControl("", [
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚ\\s]+$'),
        Validators.required
      ]),
      email: new FormControl("", [
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
        Validators.required
      ]),
      password: new FormControl("", [
        Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$'),
        Validators.required
      ]),
      passwordCheck: new FormControl("", [
        Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$'),
        Validators.required
      ]),
      imagenUno: new FormControl("", [
        Validators.required
      ]),
      imagenDos: new FormControl("", [
        Validators.required
      ]),
    }, passwordValidator());
  }

  get nombre() {
    return this.form.get('nombre');
  }

  get apellido() {
    return this.form.get('apellido');
  }

  get edad() {
    return this.form.get('edad');
  }

  get dni() {
    return this.form.get('dni');
  }

  get obraSocial() {
    return this.form.get('obraSocial');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get passwordCheck() {
    return this.form.get('passwordCheck');
  }

  get imagenUno() {
    return this.form.get('imagenUno');
  }

  get imagenDos() {
    return this.form.get('imagenDos');
  }

  async altaPaciente(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const imagenUno: HTMLInputElement | null = document.getElementById('imagenUno') as HTMLInputElement;
    const fileInput2: HTMLInputElement | null = document.getElementById('imagenDos') as HTMLInputElement;
    const file1 = imagenUno?.files?.[0];
    const file2 = fileInput2?.files?.[0];

    if (file1 && file2) {
      try {
        const downloadURL1 = await this.uploadImage(file1, 'imagenUno');
        const downloadURL2 = await this.uploadImage(file2, 'imagenDos');

        const paciente = new Paciente(
          this.form.value.nombre,
          this.form.value.apellido,
          this.form.value.edad,
          this.form.value.dni,
          this.form.value.obraSocial,
          this.form.value.email,
          downloadURL1,
          downloadURL2,
        );

        const email: string = this.form.value.email;
        const password: string = this.form.value.password;

        this.loginService.altaPaciente(email, password, paciente)
          .then(response => {
            if (response.success) {
              this.showSuccessAlert(response.message).then(() => {
                this.form.reset();
              });
            } else {
              this.showErrorAlert(response.message).then(() => {
                this.form.reset();
              });
            }
          })
          .catch(error => {
            this.showErrorAlert('Error al dar de alta al paciente: ' + error).then(() => {
              this.form.reset();
            });
          });
      } catch (e) {
        this.showErrorAlert('Error al subir las imagenes, intente nuevamente.').then(() => {
          this.form.reset();
        });
      }
    } else {
      this.showErrorAlert('Es necesario subir dos imagenes para el paciente, intente nuevamente.').then(() => {
        this.form.reset();
      });
    }
  }

  private async uploadImage(file: File, imageName: string): Promise<string> {
    const imageRef = ref(this.storage, `images/${imageName}-${file.name}`);
    const response = await uploadBytes(imageRef, file);
    return await getDownloadURL(response.ref);
  }

  /**
   * Muestra mensaje de exito
   * @param message
   * @private
   */
  private showSuccessAlert(message: string) {
    return Swal.fire({
      title: 'Paciente dado de alta exitosamente!',
      text: message,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }

  /**
   * Muestra mensaje de error
   * @param message
   * @private
   */
  private showErrorAlert(message: string) {
    return Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonText: 'Cerrar'
    });
  }

}
