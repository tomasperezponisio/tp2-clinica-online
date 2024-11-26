import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Chart, registerables} from 'chart.js';
import {ReportesService} from '../../services/reportes.service';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {jsPDF} from 'jspdf';
import html2canvas from 'html2canvas';
import {Login} from "../../models/login";
import {UcfirstPipe} from "../../pipes/ucfirst.pipe";
import {ObscureEmailPipe} from "../../pipes/obscure-email.pipe";
import {HoverEmailDirective} from "../../directivas/hover.email.directive";
import {FormatearFechaPipe} from "../../pipes/formatear-fecha.pipe";

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf,
    UcfirstPipe,
    ObscureEmailPipe,
    HoverEmailDirective,
    FormatearFechaPipe,
    DatePipe
  ],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.css',
  providers: [DatePipe],
})
export class InformesComponent implements OnInit {
  // para turnos
  fechaInicioTurnos: string = '';
  fechaFinTurnos: string = '';
  graficoTurnos: Chart | null = null;

  // para logins
  fechaInicioLogins: string = '';
  fechaFinLogins: string = '';
  loginsPorDia: { [key: string]: Login[] } = {}; // Grouped logins by date
  loading: boolean = true;

  // para turnos por médico
  fechaInicioTurnosPorMedico: string = '';
  fechaFinTurnosPorMedico: string = '';
  graficoTurnosPorMedico: Chart | null = null;

  // para turnos finalizados por medico
  fechaInicioTurnosFinalizados: string = '';
  fechaFinTurnosFinalizados: string = '';
  graficoTurnosFinalizadosPorMedico: Chart | null = null;

  @ViewChild('pdfContent', {static: false}) pdfContent!: ElementRef;

  constructor(
    private reportesService: ReportesService
  ) {
    Chart.register(...registerables);
  }

  /**
   * Método llamado al iniciar el componente. Realiza varias operaciones asíncronas para obtener y formatear datos
   * necesarios para la generación de diferentes gráficos y reportes. Establece intervalos de fechas y llama a métodos
   * de generación de gráficos específicos para especialidades, turnos por día, turnos por médico, turnos finalizados
   * por médico y logins por día. Marca la carga del componente como completada al terminar.
   *
   * @return {Promise<void>} Promesa que se resuelve cuando todas las operaciones asíncronas han finalizado.
   */
  async ngOnInit(): Promise<void> {
    const data = await this.reportesService.traerTurnosPorEspecialidad();
    this.chartEspecialidades(data);

    const today = new Date();

    this.fechaFinTurnos = this.formatDate(today);
    this.fechaInicioTurnos = this.formatDate(this.subtractDays(today, 7));
    await this.chartTurnosPorDia();

    this.fechaFinTurnosPorMedico = this.formatDate(today);
    this.fechaInicioTurnosPorMedico = this.formatDate(this.subtractDays(today, 7));
    await this.chartTurnosPorMedico();

    this.fechaFinTurnosFinalizados = this.formatDate(today);
    this.fechaInicioTurnosFinalizados = this.formatDate(this.subtractDays(today, 7));
    await this.chartTurnosFinalizadosPorMedico();

    const logins = await this.reportesService.getLogins();
    this.fechaFinLogins = this.formatDate(today);
    this.fechaInicioLogins = this.formatDate(this.subtractDays(today, 7));
    this.LoginsPorDia(logins);
    this.loading = false;

  }

  // ################# TURNOS POR ESPECIALIDAD ###############################
  /**
   * Genera un gráfico de barras que muestra la cantidad de turnos por especialidad médica.
   *
   * @param {Object} data Un objeto donde las claves son las especialidades y los valores la cantidad de turnos.
   * @return {void} No retorna ningún valor.
   */
  chartEspecialidades(data: any): void {
    const ctx1 = (document.getElementById('chartEspecialidades') as HTMLCanvasElement).getContext('2d');
    if (!ctx1) return;
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            label: 'Turnos por Especialidad',
            data: Object.values(data),
            backgroundColor: 'rgba(235,54,87,0.4)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Cantidad de turnos por especialidad',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Fechas',
            },
          }
        }
      },
    });
  }

  // ################# TURNOS POR DIA ###############################
  /**
   * Genera un gráfico de barras apiladas que muestra la cantidad de turnos por día diferenciados por su estado.
   * La gráfica es generada en un elemento canvas con el ID 'chartTurnosPorDia'.
   * Destruye la gráfica anterior si ya existe para evitar duplicación.
   * Los estados considerados son: 'pendiente', 'aceptado', 'rechazado', 'cancelado', y 'realizado'.
   * Los datos son obtenidos desde un servicio que devuelve turnos por día y estado dentro del rango de fechas especificado.
   *
   * @return {Promise<void>} Una promesa que se resuelve cuando la gráfica ha sido generada y representada en el canvas.
   */
  async chartTurnosPorDia(): Promise<void> {
    const data = await this.reportesService.traerTurnosPorDiaAndEstado(this.fechaInicioTurnos, this.fechaFinTurnos);

    if (this.graficoTurnos) {
      this.graficoTurnos.destroy(); // Destroy the previous chart to avoid duplication
    }

    const ctx = (document.getElementById('chartTurnosPorDia') as HTMLCanvasElement).getContext('2d');

    // Prepare datasets for each estado
    const estados = ['pendiente', 'aceptado', 'rechazado', 'cancelado', 'realizado'];
    const datasets = estados.map((estado) => ({
      label: estado.charAt(0).toUpperCase() + estado.slice(1),
      data: Object.keys(data).map((date) => data[date][estado] || 0),
      backgroundColor: this.getColorForEstado(estado),
      stack: 'Estados', // Group stacks
    }));

    if (!ctx) return;
    this.graficoTurnos = new Chart(ctx, {
      type: 'bar', // Stacked bar chart
      data: {
        labels: Object.keys(data), // Dates
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Fechas',
            },
            stacked: true, // Enable stacking
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de turnos por día',
            },
            beginAtZero: true,
            stacked: true, // Enable stacking
          },
        },
      },
    });
  }

  /**
   * Formatea la fecha dada en un string en el formato YYYY-MM-DD.
   *
   * @param {Date} date - La fecha a formatear.
   * @return {string} La fecha formateada en el formato YYYY-MM-DD.
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Resta una cantidad específica de días a una fecha dada.
   *
   * @param {Date} date - La fecha de inicio que se utilizará para la resta.
   * @param {number} days - El número de días que se restarán de la fecha.
   * @return {Date} - Una nueva fecha que representa la fecha original menos los días especificados.
   */
  subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  /**
   * Obtiene el color correspondiente para un estado dado.
   *
   * @param {string} estado - El nombre del estado para el cual se necesita obtener el color.
   *
   * @return {string} El color en formato RGBA correspondiente al estado proporcionado.
   */
  getColorForEstado(estado: string): string {
    const colors: { [key: string]: string } = {
      cancelado: 'rgba(255, 99, 132, 0.8)',
      rechazado: 'rgba(232,113,38,0.8)',
      pendiente: 'rgba(255, 206, 86, 0.8)',
      aceptado: 'rgba(75, 192, 192, 0.8)',
      realizado: 'rgba(29,110,204,0.8)',
    };
    return colors[estado] || 'rgba(201, 203, 207, 0.8)';
  }

  // ################# LOGINS ###############################
  /**
   * Procesa una lista de registros de inicio de sesión y los agrupa por día.
   *
   * @param {any[]} logins - Una lista de objetos de login, cada uno con la propiedad `fecha`, `email`, `nombreYApellido` y `tipo`.
   * @return {void} No devuelve ningún valor.
   */
  LoginsPorDia(logins: any[]): void {
    this.loginsPorDia = logins.reduce((acc: any, login: any) => {
      const date = new Date(login.fecha.seconds * 1000); // Firestore timestamp
      const formattedDate = date.toLocaleDateString('es-AR');

      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push({
        email: login.email,
        nombreYApellido: login.nombreYApellido,
        tipo: login.tipo,
        hora: date,
      });

      acc[formattedDate].sort((a: any, b: any) => b.hora.getTime() - a.hora.getTime());

      return acc;
    }, {});
  }

  /**
   * Filtra los inicios de sesión (logins) dentro de un rango de fechas especificado.
   *
   * @return {Promise<void>} Una promesa que se resuelve cuando la operación de filtrado se ha completado.
   */
  async filtrarLogins(): Promise<void> {
    if (this.fechaInicioLogins && this.fechaFinLogins) {
      this.loading = true;

      // Fetch logins by date range
      const logins = await this.reportesService.traerLoginsPorRangoDeFecha(this.fechaInicioLogins, this.fechaFinLogins);

      // Group logins by date
      this.LoginsPorDia(logins);

      this.loading = false;
    }
  }

  protected readonly Object = Object;

  // ################# TURNOS POR ESPECIALISTA ###############################
  /**
   * Genera un gráfico de barras que representa la cantidad de turnos por médico
   * en un rango de fechas especificado. Utiliza los datos obtenidos desde el
   * servicio de reportes y los renderiza en un canvas con ID 'chartTurnosPorMedico'.
   *
   * @return {Promise<void>} Promesa que se resuelve cuando el gráfico ha sido generado.
   */
  async chartTurnosPorMedico(): Promise<void> {
    const data = await this.reportesService.traerTurnosPorMedico(this.fechaInicioTurnos, this.fechaFinTurnos);

    if (this.graficoTurnosPorMedico) {
      this.graficoTurnosPorMedico.destroy(); // Destroy the previous chart to avoid duplication
    }

    const ctx = (document.getElementById('chartTurnosPorMedico') as HTMLCanvasElement).getContext('2d');

    if (!ctx) return;

    this.graficoTurnosPorMedico = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data), // Medico names
        datasets: [
          {
            label: 'Cantidad de Turnos',
            data: Object.values(data), // Turnos count
            backgroundColor: 'rgba(75, 192, 192, 0.8)', // Custom color
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Médicos',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de turnos',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  // ################# TURNOS FINALIZADOS POR ESPECIALISTA ###############################
  /**
   * Método que genera un gráfico de barras mostrando la cantidad de turnos
   * finalizados por cada médico, en un rango de fechas especificado.
   *
   * Obtiene los datos de turnos finalizados desde un servicio de reportes, y
   * utiliza la librería Chart.js para renderizar el gráfico en un elemento
   * canvas del documento HTML.
   *
   * @return {Promise<void>} Una promesa que resuelve cuando el gráfico ha sido
   * generado y renderizado en la página.
   */
  async chartTurnosFinalizadosPorMedico(): Promise<void> {
    const data = await this.reportesService.traerTurnosFinalizadosPorMedico(this.fechaInicioTurnosFinalizados, this.fechaFinTurnosFinalizados);

    if (this.graficoTurnosFinalizadosPorMedico) {
      this.graficoTurnosFinalizadosPorMedico.destroy(); // Destroy the previous chart to avoid duplication
    }

    const ctx = (document.getElementById('chartTurnosFinalizadosPorMedico') as HTMLCanvasElement).getContext('2d');

    if (!ctx) return;

    this.graficoTurnosFinalizadosPorMedico = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data), // Medico names
        datasets: [
          {
            label: 'Cantidad de Turnos Finalizados',
            data: Object.values(data), // Finalized turnos count
            backgroundColor: 'rgba(54, 162, 235, 0.8)', // Custom color
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Médicos',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de turnos finalizados',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /**
   * Genera y descarga un informe en formato PDF que incluye diversas secciones
   * estadísticamente relevantes de la administración de la clínica. El informe
   * incluye un encabezado con fecha de generación y un pie de página con numeración.
   *
   * @return {void} No devuelve un valor, inicia la descarga del PDF generado.
   */
  descargarComoPDF(): void {
    const logoUrl = 'https://i.imgur.com/e7Swn1C.png';

    const getCurrentDateTime = (): string => {
      const now = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : n); // Helper to pad single digits
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1); // Months are 0-based
      const year = now.getFullYear();
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      return `${day}-${month}-${year}_${hours}:${minutes}:${seconds}`;
    };

    const currentDateTime = getCurrentDateTime();
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    const sections = [
      {id: 'turnosEspecialidadSection', title: 'Cantidad de Turnos por Especialidad'},
      {id: 'turnosDiaSection', title: 'Cantidad de Turnos por Día'},
      {id: 'turnosMedicoSection', title: 'Cantidad de Turnos Solicitado por Médico'},
      {id: 'turnosFinalizadosMedicoSection', title: 'Cantidad de Turnos Finalizados por Médico'},
      {id: 'loginsSection', title: 'Log de Ingresos al Sistema'},
    ];

    const addHeader = () => {
      pdf.addImage(logoUrl, 'PNG', 10, 10, 20, 20);
      pdf.setFontSize(14);
      pdf.text('Clínica Online - Informe administración', 40, 20);
      pdf.setFontSize(10);
      pdf.text(`Fecha de emisión: ${currentDateTime}`, 40, 26);
      pdf.line(10, 35, pdfWidth - 10, 35);
    };

    const addPageNumbers = (totalPages: number) => {
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(`Página ${i} de ${totalPages}`, pdfWidth / 2, pdf.internal.pageSize.getHeight() - 10, {
          align: 'center'
        });
      }
    };

    const adjustScrollableContent = (sectionElement: HTMLElement, enable: boolean) => {
      if (enable) {
        sectionElement.style.overflow = 'visible';
        sectionElement.style.maxHeight = 'none';
      } else {
        sectionElement.style.removeProperty('overflow');
        sectionElement.style.removeProperty('max-height');
      }
    };

    const captureSection = async (section: { id: string, title: string }) => {
      const sectionElement = document.getElementById(section.id);
      const tableResponsive = document.getElementById('table-responsive');

      if (sectionElement && tableResponsive) {
        // Temporarily remove scroll styles
        adjustScrollableContent(tableResponsive, true);

        const canvas = await html2canvas(sectionElement);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - 20; // Account for margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addPage();
        addHeader();
        pdf.setFontSize(12);
        pdf.text(section.title, 10, 40);
        pdf.addImage(imgData, 'PNG', 10, 50, imgWidth, imgHeight);

        // Restore scroll styles
        adjustScrollableContent(tableResponsive, false);
      }
    };

    addHeader();

    Promise.all(
      sections.map((section) => captureSection(section))
    ).then(() => {
      pdf.deletePage(1);
      const totalPages = pdf.getNumberOfPages();
      addPageNumbers(totalPages);
      pdf.save(`Informe_Administracion_${currentDateTime}.pdf`);
    }).catch((error) => {
      console.error('Error exporting to PDF:', error);
    });
  }
}
