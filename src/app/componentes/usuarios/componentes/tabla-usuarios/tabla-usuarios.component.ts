import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {map, Observable} from "rxjs";
import {UsuariosService} from "../../../../services/usuarios.service";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {HoverZoomDirective} from "../../../../directivas/hover.zoom.directive.directive";

@Component({
  selector: 'app-tabla-usuarios',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe,
    ReactiveFormsModule,
    HoverZoomDirective
  ],
  templateUrl: './tabla-usuarios.component.html',
  styleUrl: './tabla-usuarios.component.css'
})
export class TablaUsuariosComponent implements OnInit {
  formUsuario!: FormGroup;
  selectedTipo: string = 'paciente';

  usuarios$!: Observable<any[]>;
  filteredUsuarios$!: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService
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
}
