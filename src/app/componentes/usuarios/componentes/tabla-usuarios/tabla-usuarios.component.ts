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
  selectedTipo: string = 'paciente';

  usuarios$!: Observable<any[]>;
  filteredUsuarios$!: Observable<any[]>;
  showHistoriaClinicaModal: boolean = false;
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

    this.usuarios$ = this.usuariosService.getUsuarios(); // Fetch all users

    // Update `selectedTipo` whenever the radio button selection changes
    this.formUsuario.get('tipoDeUsuario')?.valueChanges.subscribe(tipo => {
      this.selectedTipo = tipo;
      this.filterUsuarios();
    });

    // Set up filtered list based on the selected type
    this.filterUsuarios();
  }

  filterUsuarios(): void {
    this.filteredUsuarios$ = this.usuarios$.pipe(
      map(usuarios => usuarios.filter(usuario => usuario.tipo === this.selectedTipo))
    );
  }

  toggleVerificado(user: any) {
    user.verificado = !user.verificado;
    this.usuariosService.updateVerificado(user.uid, user.verificado);
  }

  mostrarHistoriaClinica(usuario: any): void {
    this.pacienteSeleccionado = usuario;
    this.turnosService.traerHistoriaClinicaPaciente(usuario.uid).then(historias => {
      this.historiasClinicas = historias;
      this.showHistoriaClinicaModal = true;
    }).catch(error => {
      console.error('Error al cargar historias clínicas:', error);
      this.historiasClinicas = []; // Ensure we show the "No data" message
      this.showHistoriaClinicaModal = true;
    });
  }

  cerrarModal(): void {
    this.showHistoriaClinicaModal = false;
    this.pacienteSeleccionado = null;
    this.historiasClinicas = [];
  }

}
