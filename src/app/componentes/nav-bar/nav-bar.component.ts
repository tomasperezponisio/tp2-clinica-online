import {Component, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {AsyncPipe, NgIf} from "@angular/common";
import {LoginService} from "../../services/login.service";
import {UsuariosService} from "../../services/usuarios.service";
import {AlertService} from "../../services/alert.service";

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    RouterLink,
    RouterLinkActive,
    AsyncPipe
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent implements OnInit {
  userData: { isLoggedIn: boolean; tipo?: string; nombre?: string } | null = null;

  constructor(
    private router: Router,
    protected loginService: LoginService,
    protected usuariosService: UsuariosService,
    private alertService: AlertService,
  ) {
  }

  ngOnInit(): void {
    this.usuariosService.userData$.subscribe((data) => {
      this.userData = data;
    });
  }

  closeSession() {
    this.loginService.auth.signOut().then(() => {
      this.alertService.customAlert('Cerraste sesión!', "Logueate para acceder.", 'error').then(() => {
        this.router.navigate(['home']);
      });
    });
  }

}
