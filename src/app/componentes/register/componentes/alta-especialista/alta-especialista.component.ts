import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {LoginService} from "../../../../services/login.service";
import {getDownloadURL, ref, Storage, uploadBytes} from "@angular/fire/storage";
import {passwordValidator} from "../../../../validadores/password.validator";
import Swal from "sweetalert2";
import {Especialista} from "../../../../models/especialista";
import {Observable} from "rxjs";
import {EspecialidadesService} from "../../../../services/especialidades.service";

@Component({
  selector: 'app-alta-especialista',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgForOf,
    AsyncPipe
  ],
  templateUrl: './alta-especialista.component.html',
  styleUrl: './alta-especialista.component.css'
})
export class AltaEspecialistaComponent  implements OnInit {
  form!: FormGroup;
  // especialidades: string[] = ['Cardiología', 'Neurología', 'Dermatología'];
  especialidades$!: Observable<string[]>;

  constructor(
    private loginService: LoginService,
    private storage: Storage,
    private especialidadesService: EspecialidadesService
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
      especialidad: new FormControl("", [
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚ\\s]+$'),
        Validators.required
      ]),
      customEspecialidad: new FormControl("", [
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚ\\s]+$')
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
    }, passwordValidator());

    this.especialidades$ = this.especialidadesService.getEspecialidades();
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

  get especialidad() {
    return this.form.get('especialidad');
  }

  get customEspecialidad() {
    return this.form.get('customEspecialidad');
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

  async altaEspecialista(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const imagenUno: HTMLInputElement | null = document.getElementById('imagenUno') as HTMLInputElement;
    const file1 = imagenUno?.files?.[0];

    if (file1) {
      try {
        const downloadURL1 = await this.uploadImage(file1, 'imagenUno');

        // Get the value for "especialidad" based on selection
        const especialidad: string[] = [];
        if (this.form.value.especialidad === 'other') {
          especialidad.push(this.form.value.customEspecialidad);
        } else {
          especialidad.push(this.form.value.especialidad);
        }

        const especialista = new Especialista(
          this.form.value.nombre,
          this.form.value.apellido,
          this.form.value.edad,
          this.form.value.dni,
          especialidad,
          this.form.value.email,
          downloadURL1
        );

        const email: string = this.form.value.email;
        const password: string = this.form.value.password;

        this.loginService.altaEspecialista(email, password, especialista)
          .then(response => {
            if (response.success) {
              this.showSuccessAlert('Especialista dado de alta exitosamente!', response.message).then(() => {
                this.form.reset();
              });
            } else {
              this.showErrorAlert(response.message).then(() => {
                this.form.reset();
              });
            }
          })
          .catch(error => {
            this.showErrorAlert('Error al dar de alta al especialista: ' + error).then(() => {
              this.form.reset();
            });
          });
      } catch (e) {
        this.showErrorAlert('Error al subir las imagenes, intente nuevamente.').then(() => {
          this.form.reset();
        });
      }
    } else {
      this.showErrorAlert('Es necesario subir dos imagenes para el especialista, intente nuevamente.').then(() => {
        this.form.reset();
      });
    }
  }

  private async uploadImage(file: File, imageName: string): Promise<string> {
    const imageRef = ref(this.storage, `images/${imageName}-${file.name}`);
    const response = await uploadBytes(imageRef, file);
    return await getDownloadURL(response.ref);
  }

  alCambiarEspecialidad(event: Event): void {
    const select = event.target as HTMLSelectElement;
    console.log(select.value);
    if (select.value === 'otra') {
      this.form.get('customEspecialidad')?.setValidators([Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚ\\s]+$')]);
    } else {
      this.form.get('customEspecialidad')?.clearValidators();
      this.form.get('customEspecialidad')?.reset();
    }
    this.form.get('customEspecialidad')?.updateValueAndValidity();
  }

  async agregarEspecialidad(): Promise<void> {
    const nuevaEspecialidad = this.form.value.customEspecialidad;
    if (!nuevaEspecialidad) return;

    try {
      await this.especialidadesService.addEspecialidad(nuevaEspecialidad);
      this.showSuccessAlert('Nueva especialidad agregada.', `Especialidad "${nuevaEspecialidad}" agregada con éxito.`);

      this.form.patchValue({ especialidad: nuevaEspecialidad, customEspecialidad: '' });
    } catch (error) {
      console.error('Error adding specialty:', error);
      this.showErrorAlert('Error al agregar la especialidad. Intenta de nuevo.');
    }
  }

  /**
   * Muestra mensaje de exito
   * @param title
   * @param message
   * @private
   */
  private showSuccessAlert(title: string, message: string) {
    return Swal.fire({
      title: title,
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
