import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {TurnosService} from "../../services/turnos.service";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  pacientesConHistorias: any[] = []; // Array to store pacientes with their historias clínicas
  usuarioActual: any;

  constructor(
    private authService: AuthService,
    private turnosService: TurnosService
  ) {}

  ngOnInit(): void {
    this.authService.traerUsuarioActual().subscribe((user) => {
      this.usuarioActual = user;
      if (user.tipo === 'especialista') {
        this.cargarPacientesConHistorias();
      }
    });
  }

  cargarPacientesConHistorias(): void {
    this.turnosService.traerPacientesAtendidos(this.usuarioActual.uid).then(pacientes => {
      this.pacientesConHistorias = pacientes;
    });
  }
}
