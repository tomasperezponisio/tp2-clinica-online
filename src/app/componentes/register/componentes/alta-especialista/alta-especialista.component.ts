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
import {AlertService} from "../../../../services/alert.service";
import {CaptchaComponent} from "../../../captcha/captcha.component";

@Component({
  selector: 'app-alta-especialista',
  standalone: true,
    imports: [
        NgIf,
        ReactiveFormsModule,
        NgForOf,
        AsyncPipe,
        CaptchaComponent
    ],
  templateUrl: './alta-especialista.component.html',
  styleUrl: './alta-especialista.component.css'
})
export class AltaEspecialistaComponent implements OnInit {
  form!: FormGroup;

  // Flag to track CAPTCHA validity
  isCaptchaValid: boolean = false;

  // especialidades: string[] = ['Cardiología', 'Neurología', 'Dermatología'];
  especialidades$!: Observable<string[]>;

  constructor(
    private loginService: LoginService,
    private storage: Storage,
    private especialidadesService: EspecialidadesService,
    private alertService: AlertService
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
      especialidad: new FormControl([], [
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

  /**
   * Handles the CAPTCHA validation result emitted by CaptchaComponent.
   * @param isValid Boolean indicating whether CAPTCHA is valid.
   */
  onCaptchaValid(isValid: boolean): void {
    this.isCaptchaValid = isValid;
    // Optionally, you can trigger form validation
    // this.form.updateValueAndValidity();
  }

  /**
   * Registra un nuevo especialista si el formulario es válido y se proporciona la imagen requerida.
   * El metodo sube la imagen, crea un nuevo objeto `Especialista`, y llama al
   * servicio de login para registrar al especialista. Se muestran diversas alertas de éxito
   * y error basadas en el resultado de la subida de imágenes o del proceso de registro.
   *
   * @return {Promise<void>} Una promesa que se resuelve cuando el proceso de registro del especialista se completa.
   */
  async altaEspecialista(): Promise<void> {
    if (this.form.invalid || !this.isCaptchaValid) {
      await this.alertService.customAlert('Formulario inválido', 'Por favor, complete correctamente todos los campos y resuelva el CAPTCHA.', 'error');
      return;
    }

    const imagenUno: HTMLInputElement | null = document.getElementById('imagenUno') as HTMLInputElement;
    const file1 = imagenUno?.files?.[0];

    if (file1) {
      try {
        const downloadURL1 = await this.uploadImage(file1, 'imagenUno');

        // Si hay especialidades seleccionadas las agrego al array
        let especialidadesSeleccionadas = this.form.value.especialidad || [];
        if (this.form.value.customEspecialidad) {
          especialidadesSeleccionadas = [...especialidadesSeleccionadas, this.form.value.customEspecialidad];
        }

        const especialista = new Especialista(
          this.form.value.nombre.trim(),
          this.form.value.apellido.trim(),
          parseInt(this.form.value.edad, 10),
          parseInt(this.form.value.dni, 10),
          especialidadesSeleccionadas,
          this.form.value.email.trim(),
          downloadURL1
          // 'tipo', 'verificado', 'disponibilidad', y 'uid' están seteados por default
        );

        console.log('especialista en componente: ' + especialista);

        const email: string = this.form.value.email;
        const password: string = this.form.value.password;


        const response = await this.loginService.altaEspecialista(email, password, especialista);

        if (response.success) {
          await this.alertService.customAlert('¡Especialista dado de alta exitosamente!', response.message, 'success');
          this.form.reset();
        } else {
          await this.alertService.customAlert('Error al registrar', response.message, 'error');
        }

      } catch (e: any) { // Type as any to capture all error properties
        console.error('Error en altaEspecialista:', e);
        await this.alertService.customAlert('Error', 'Error al subir las imágenes, intente nuevamente.', 'error');
        this.form.reset();
      }
    } else {
      await this.alertService.customAlert('Error', 'Es necesario subir una imagen para el especialista, intente nuevamente.', 'error');
      this.form.reset();
    }
  }

  private async uploadImage(file: File, imageName: string): Promise<string> {
    const imageRef = ref(this.storage, `images/${imageName}-${file.name}`);
    const response = await uploadBytes(imageRef, file);
    return await getDownloadURL(response.ref);
  }

  async agregarEspecialidad(): Promise<void> {
    const nuevaEspecialidad = this.form.value.customEspecialidad;
    if (!nuevaEspecialidad) return;

    try {
      await this.especialidadesService.addEspecialidad(nuevaEspecialidad);
      this.showSuccessAlert('Nueva especialidad agregada.', `Especialidad "${nuevaEspecialidad}" agregada con éxito.`);

      this.form.patchValue({especialidad: nuevaEspecialidad, customEspecialidad: ''});
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
