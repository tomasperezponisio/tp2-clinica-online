import {Component, OnInit, LOCALE_ID} from '@angular/core';
import {Observable} from "rxjs";
import {UsuariosService} from "../../services/usuarios.service";
import {AsyncPipe, DatePipe, NgForOf, NgIf, registerLocaleData, TitleCasePipe} from "@angular/common";
import localeEsAr from '@angular/common/locales/es-AR';
import {MisHorariosComponent} from "./componentes/mis-horarios/mis-horarios.component";
import {TurnosService} from "../../services/turnos.service";

registerLocaleData(localeEsAr, 'es-AR');

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MisHorariosComponent,
    NgForOf,
    DatePipe,
    TitleCasePipe
  ],
  providers: [
    // Set the LOCALE_ID to 'es-AR' for the entire application
    {provide: LOCALE_ID, useValue: 'es-AR'},
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent implements OnInit {
  userData$!: Observable<any>;
  userType: string = '';
  historiasClinicas: any[] = [];

  constructor(
    private usuariosService: UsuariosService,
    private turnosService: TurnosService
  ) {
  }

  ngOnInit(): void {
    this.userData$ = this.usuariosService.userData$;

    this.userData$.subscribe((data) => {
      if (data && data.isLoggedIn) {
        this.userType = data.tipo;

        if (this.userType === 'paciente') {
          this.turnosService.traerHistoriaClinicaPaciente(data.uid).then(historias => {
            this.historiasClinicas = historias;
          });
        }

      } else {
        console.log('No hay data para mostrar.');
      }
    });
  }
}
