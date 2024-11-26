import {Component} from '@angular/core';
import {LoginService} from "../../services/login.service";
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {AlertService} from "../../services/alert.service";

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
    private loginService: LoginService,
    private alertService: AlertService,
  ) {
  }


  /**
   * Inicia sesión con las credenciales proporcionadas.
   * Verifica que el email y la contraseña sean válidos antes de intentar el inicio de sesión.
   * Muestra mensajes de error apropiados si las credenciales no son válidas.
   *
   * @return {void} No retorna un valor explícito, pero redirecciona al usuario a la página de inicio si el inicio de sesión es exitoso.
   */
  login(): void {

    if (!this.email || !this.email.trim()) {
      this.msjError = "Ingrese email";
      this.alertService.customAlert('Error!', this.msjError, 'error');
      return;
    } else if (!this.isValidEmail(this.email)) {
      this.msjError = "Email no válido";
      this.alertService.customAlert('Error!', this.msjError, 'error');
      return;
    }

    if (!this.password || !this.password.trim()) {
      this.msjError = "Ingrese contraseña";
      this.alertService.customAlert('Error!', this.msjError, 'error');
      return;
    }

    this.loginService.login(this.email, this.password)
      .then((result) => {
        if (result.success) {
          this.alertService.customAlert('Login exisoto!', 'Será redireccionado al home.', 'success').then(() => {
            this.router.navigate(['/home']);
          });

        } else {
          this.alertService.customAlert('Error!', result.message, 'error');
        }
      });
  }

  autoCompletarPaciente1() {
    this.email = 'pobajo1860@inikale.com'; // Juan Peperulo
    this.password = 'a1234567';
  }

  autoCompletarPaciente2() {
    this.email = 'kexafih386@gianes.com'; // Pepe Sanchez
    this.password = 'a1234567';
  }

  autoCompletarPaciente3() {
    this.email = 'finbal@tempmailto.org'; // Cosme Fulanito
    this.password = 'a1234567';
  }

  autoCompletarEspecialista1() {
    this.email = 'corkipikni@gufum.com'; // Nick Riviera
    this.password = 'a1234567';
  }

  autoCompletarEspecialista2() {
    this.email = 'virkufostu@gufum.com'; // Dr Ahorro
    this.password = 'a1234567';
  }

  autoCompletarAdmin() {
    this.email = 'daseniba@polkaroad.net';
    this.password = 'a1234567';
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

}
