import {Component, OnInit} from '@angular/core';
import {AsyncPipe, DatePipe, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {map, Observable} from "rxjs";
import {UsuariosService} from "../../../../services/usuarios.service";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {HoverZoomDirective} from "../../../../directivas/hover.zoom.directive.directive";
import {TurnosService} from "../../../../services/turnos.service";

@Component({
  selector: 'app-tabla-usuarios',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe,
    ReactiveFormsModule,
    HoverZoomDirective,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './tabla-usuarios.component.html',
  styleUrl: './tabla-usuarios.component.css'
})
export class TablaUsuariosComponent implements OnInit {
  formUsuario!: FormGroup;
  tipoDeUsuario: string = 'paciente';

  usuarios$!: Observable<any[]>;
  usuariosFiltrados$!: Observable<any[]>;
  mostrarModalHistoriaClinica: boolean = false;
  historiasClinicas: any[] = [];
  pacienteSeleccionado: any = null;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private turnosService: TurnosService
  ) {
  }

  ngOnInit(): void {
    this.formUsuario = this.fb.group({
      tipoDeUsuario: ['paciente']
    });

    this.usuarios$ = this.usuariosService.traerUsuarios();

    // Update `selectedTipo` whenever the radio button selection changes
    this.formUsuario.get('tipoDeUsuario')?.valueChanges.subscribe(tipo => {
      this.tipoDeUsuario = tipo;
      this.filtrarUsuarios();
    });

    // Set up filtered list based on the selected type
    this.filtrarUsuarios();
  }

  filtrarUsuarios(): void {
    this.usuariosFiltrados$ = this.usuarios$.pipe(
      map(usuarios => usuarios.filter(usuario => usuario.tipo === this.tipoDeUsuario))
    );
  }

  toggleVerificado(user: any) {
    user.verificado = !user.verificado;
    this.usuariosService.actualizarVerificado(user.uid, user.verificado);
  }

  mostrarHistoriaClinica(usuario: any): void {
    this.pacienteSeleccionado = usuario;
    this.turnosService.traerHistoriaClinicaPaciente(usuario.uid).then(historias => {
      this.historiasClinicas = historias;
      this.mostrarModalHistoriaClinica = true;
    }).catch(error => {
      console.error('Error al cargar historias clínicas:', error);
      this.historiasClinicas = []; // Ensure we show the "No data" message
      this.mostrarModalHistoriaClinica = true;
    });
  }

  cerrarModal(): void {
    this.mostrarModalHistoriaClinica = false;
    this.pacienteSeleccionado = null;
    this.historiasClinicas = [];
  }

}
