import {Component} from '@angular/core';
import Swal from "sweetalert2";
import {LoginService} from "../../services/login.service";
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email!: string;
  password!: string;
  msjError: string = "";

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {
  }


  login() {

    if (!this.email || !this.email.trim()) {
      this.msjError = "Ingrese email";
      this.showErrorAlert(this.msjError);
      return;
    } else if (!this.isValidEmail(this.email)) {
      this.msjError = "Email no válido";
      this.showErrorAlert(this.msjError);
      return;
    }

    if (!this.password || !this.password.trim()) {
      this.msjError = "Ingrese contraseña";
      this.showErrorAlert(this.msjError);
      return;
    }

    this.loginService.login(this.email, this.password)
      .then((result) => {
        if (result.success) {
          this.showSuccessAlert('Será redireccionado al home.').then(() => {
            this.router.navigate(['/home']);
          });

        } else {
          this.showErrorAlert(result.message);
        }
      });
  }

  autoCompletarPaciente() {
    this.email = 'pobajo1860@inikale.com';
    this.password = 'a1234567';
  }

  autoCompletarEspecialista() {
    this.email = 'vecahe5227@anypng.com';
    this.password = 'a1234567';
  }

  autoCompletarAdmin() {
    this.email = 'pobajo1860@inikale.com';
    this.password = 'a1234567';
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
      confirmButtonText: 'Cerrar'
    });
  }

  private showSuccessAlert(message: string) {
    return Swal.fire({
      title: 'Login exisoto!',
      text: message,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

}
