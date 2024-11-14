import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgIf} from "@angular/common";
import {LoginService} from "../../../../services/login.service";
import {getDownloadURL, ref, Storage, uploadBytes} from "@angular/fire/storage";
import {passwordValidator} from "../../../../validadores/password.validator";
import {Admin} from "../../../../models/admin";
import {AlertService} from "../../../../services/alert.service";

@Component({
  selector: 'app-alta-admin',
  standalone: true,
    imports: [
        FormsModule,
        NgIf,
        ReactiveFormsModule
    ],
  templateUrl: './alta-admin.component.html',
  styleUrl: './alta-admin.component.css'
})
export class AltaAdminComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private loginService: LoginService,
    private storage: Storage,
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

  async altaAdmin(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const imagenUno: HTMLInputElement | null = document.getElementById('imagenUno') as HTMLInputElement;
    const file1 = imagenUno?.files?.[0];

    if (file1) {
      try {
        const downloadURL1 = await this.uploadImage(file1, 'imagenUno');

        const admin = new Admin(
          this.form.value.nombre,
          this.form.value.apellido,
          this.form.value.edad,
          this.form.value.dni,
          this.form.value.email,
          downloadURL1,
        );

        const email: string = this.form.value.email;
        const password: string = this.form.value.password;

        this.loginService.altaAdmin(email, password, admin)
          .then(response => {
            if (response.success) {
              this.alertService.customAlert('Admin dado de alta exitosamente!', response.message, 'success').then(() => {
                this.form.reset();
              });
            } else {
              this.alertService.customAlert('Error!', response.message, 'error').then(() => {
                this.form.reset();
              });
            }
          })
          .catch(error => {
            this.alertService.customAlert('Error!', 'Error al dar de alta al admin: ' + error, 'error').then(() => {
              this.form.reset();
            });
          });
      } catch (e) {
        this.alertService.customAlert('Error!', 'Error al subir las imagenes, intente nuevamente.', 'error').then(() => {
          this.form.reset();
        });
      }
    } else {
      this.alertService.customAlert('Error!', 'Es necesario subir dos imagenes para el admin, intente nuevamente.', 'error').then(() => {
        this.form.reset();
      });
    }
  }

  private async uploadImage(file: File, imageName: string): Promise<string> {
    const imageRef = ref(this.storage, `images/${imageName}-${file.name}`);
    const response = await uploadBytes(imageRef, file);
    return await getDownloadURL(response.ref);
  }

}
