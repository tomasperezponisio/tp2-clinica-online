import {Component, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {AsyncPipe, NgIf} from "@angular/common";
import Swal from "sweetalert2";
import {LoginService} from "../../services/login.service";
import {Observable} from "rxjs";

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
    protected loginService: LoginService
  ) {
  }

  ngOnInit(): void {
    this.loginService.userData$.subscribe((data) => {
      this.userData = data;
    });
  }

  closeSession() {
    this.loginService.auth.signOut().then(() => {
      this.showErrorAlert("Logueate para acceder.").then(() => {
        this.router.navigate(['home']);
      });
    });
  }

  consoleLog() {
    console.log(this.userData);
  }

  private showErrorAlert(message: string) {
    return Swal.fire({
      title: 'Cerraste sesión!',
      text: message,
      icon: 'error',
      confirmButtonText: 'Cerrar'
    });
  }

}
