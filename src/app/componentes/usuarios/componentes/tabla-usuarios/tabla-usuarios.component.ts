import {Component, OnInit} from '@angular/core';
import {AsyncPipe, DatePipe, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import {map, Observable, take} from "rxjs";
import {UsuariosService} from "../../../../services/usuarios.service";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {HoverZoomDirective} from "../../../../directivas/hover.zoom.directive";
import {TurnosService} from "../../../../services/turnos.service";
import {UcfirstPipe} from "../../../../pipes/ucfirst.pipe";
import * as XLSX from 'xlsx';
import {AlertService} from "../../../../services/alert.service";

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
    TitleCasePipe,
    UcfirstPipe
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
    private turnosService: TurnosService,
    private alertService: AlertService,
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

  exportTurnosToExcel(usuario: any): void {
    console.log(`Fetching turnos for user: ${usuario.uid}`);
    const nombreCompleto = usuario.nombre + ' ' + usuario.apellido;

    this.turnosService
      .traerTurnosPorUidDePaciente(usuario.uid)
      .pipe(take(1))
      .subscribe({
      next: (turnos) => {
        if (!turnos || turnos.length === 0) {
          console.log('No turnos found for user:', usuario.nombre);
          this.alertService.customAlert('No hay turnos', `No hay turnos de ${nombreCompleto}.`, 'error');
          return;
        }

        console.log('Fetched turnos:', turnos);

        const formattedData = turnos.map((turno) => ({
          Paciente: turno.pacienteNombre || 'N/A',
          Especialista: turno.especialistaNombre || 'N/A',
          Especialidad: turno.especialidad || 'N/A',
          Fecha: turno.fecha || 'N/A',
          Hora: turno.hora || 'N/A',
          Estado: turno.estado || 'N/A',
          Reseña: turno.reseña || 'N/A',
        }));

        console.log('Formatted data for Excel:', formattedData);

        // Generate the Excel file
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Turnos');

        const nombreCompletoExcel = `${usuario.nombre}_${usuario.apellido}`;
        XLSX.writeFile(wb, `turnos-${nombreCompletoExcel}.xlsx`);
        console.log(`Excel file generated for user: ${nombreCompletoExcel}`);
      },
      error: (err) => {
        console.error('Error fetching turnos:', err);
        this.alertService.customAlert('Error', `Error al traer los turnos de ${nombreCompleto}.`, 'error');
      },
    });
  }


}
