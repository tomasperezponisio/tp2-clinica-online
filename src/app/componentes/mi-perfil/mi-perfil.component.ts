import {Component, OnInit, LOCALE_ID, ViewChild, ElementRef} from '@angular/core';
import {Observable} from "rxjs";
import {UsuariosService} from "../../services/usuarios.service";
import {AsyncPipe, DatePipe, NgForOf, NgIf, registerLocaleData, TitleCasePipe} from "@angular/common";
import localeEsAr from '@angular/common/locales/es-AR';
import {MisHorariosComponent} from "./componentes/mis-horarios/mis-horarios.component";
import {TurnosService} from "../../services/turnos.service";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {FormsModule} from "@angular/forms";

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
    TitleCasePipe,
    FormsModule
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
  tipoDeUsuario: string = '';
  nombreDeUsuario: string = '';
  historiasClinicas: any[] = [];
  historiasClinicasFiltradas: any[] = []; // For filtered results
  especialistas: string[] = [];
  selectedEspecialista: string = 'Todos'; // Default selection

  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;

  constructor(
    private usuariosService: UsuariosService,
    private turnosService: TurnosService
  ) {
  }

  /**
   * Método de ciclo de vida que se ejecuta cuando se inicializa el componente.
   *
   * @return {void} No devuelve ningún valor.
   */
  ngOnInit(): void {
    this.userData$ = this.usuariosService.userData$;

    this.userData$.subscribe((data) => {
      if (data && data.isLoggedIn) {
        this.tipoDeUsuario = data.tipo;
        this.nombreDeUsuario = data.nombre + ' ' + data.apellido;

        if (this.tipoDeUsuario === 'paciente') {
          this.turnosService.traerHistoriaClinicaPaciente(data.uid).then((historias) => {
            this.historiasClinicas = historias;
            this.especialistas = [
              'Todos',
              ...new Set(historias.map((historia) => historia.especialistaNombre)),
            ];
            this.filtrar(); // Initialize filtered list
          });
        }

      } else {
        console.log('No hay data para mostrar.');
      }
    });
  }

  /**
   * Filtra las historias clínicas según el especialista seleccionado.
   * Si el especialista seleccionado es 'Todos', se mostrarán todas las historias clínicas.
   * De lo contrario, solo se mostrarán las historias clínicas del especialista seleccionado.
   *
   * @return {void} No retorna ningún valor.
   */
  filtrar(): void {
    if (this.selectedEspecialista === 'Todos') {
      this.historiasClinicasFiltradas = [...this.historiasClinicas];
    } else {
      this.historiasClinicasFiltradas = this.historiasClinicas.filter(
        (historia) => historia.especialistaNombre === this.selectedEspecialista
      );
    }
  }

  // Filter historias clínicas based on selected specialist
  getFilteredHistoriasClinicas(): any[] {
    if (this.selectedEspecialista === 'Todos') {
      return this.historiasClinicas;
    }
    return this.historiasClinicas.filter(
      historia => historia.especialistaNombre === this.selectedEspecialista
    );
  }

  /**
   * Genera un archivo PDF a partir del contenido HTML de la página.
   *
   * Este método captura el contenido HTML de un elemento específico,
   * añade un logo, el nombre de usuario y la fecha de emisión,
   * y finalmente descarga dicho contenido en formato PDF.
   *
   * @return {void} No retorna ningún valor.
   */
  descargarComoPDF(): void {
    const pdfContent = this.pdfContent.nativeElement;

    const logoUrl = 'https://i.imgur.com/e7Swn1C.png';

    html2canvas(pdfContent).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const currentDate = new Date().toLocaleDateString('es-AR');

      // Add the logo
      pdf.addImage(logoUrl, 'PNG', 10, 10, 20, 20); // x, y, width, height

      // Add the clinic name and date
      pdf.setFontSize(14);
      pdf.text(`Clínica Online - ${this.nombreDeUsuario}`, 40, 20);
      pdf.setFontSize(10);
      pdf.text(`Fecha de emisión: ${currentDate}`, 40, 26); // Date

      pdf.line(10, 35, pdfWidth - 10, 35); // x1, y1, x2, y2

      // Add the content below the header
      pdf.addImage(imgData, 'PNG', 10, 40, pdfWidth - 20, pdfHeight);
      pdf.save(`Historia_Clinica_${this.nombreDeUsuario}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }).catch((error) => {
      console.error('Error exporting to PDF:', error);
    });
  }

}
