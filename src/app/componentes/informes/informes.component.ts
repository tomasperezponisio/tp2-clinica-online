import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Chart, registerables} from 'chart.js';
import {ReportesService} from '../../services/reportes.service';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {jsPDF} from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf,
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
  loginsPorDia: { [key: string]: any[] } = {}; // Grouped logins by date
  loading: boolean = true;

  // para turnos por medico
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

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

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
  LoginsPorDia(logins: any[]): void {
    this.loginsPorDia = logins.reduce((acc: any, login: any) => {
      const date = new Date(login.fecha.seconds * 1000); // Firestore timestamp
      const formattedDate = date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push({
        email: login.email,
        nombreYApellido: login.nombreYApellido,
        tipo: login.tipo,
        hora: date.toLocaleTimeString('es-AR'),
      });

      return acc;
    }, {});
  }

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

  // descargarComoPDF() {
  //   const pdfContent = this.pdfContent.nativeElement;
  //
  //   const logoUrl = 'https://i.imgur.com/e7Swn1C.png';
  //
  //   html2canvas(pdfContent).then((canvas) => {
  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  //
  //     const currentDate = new Date().toLocaleDateString('es-AR');
  //
  //     // Add the logo
  //     pdf.addImage(logoUrl, 'PNG', 10, 10, 20, 20); // x, y, width, height
  //
  //     // Add the clinic name and date
  //     pdf.setFontSize(14);
  //     pdf.text(`Clínica Online - Informe administración`, 40, 20);
  //     pdf.setFontSize(10);
  //     pdf.text(`Fecha de emisión: ${currentDate}`, 40, 26); // Date
  //
  //     pdf.line(10, 35, pdfWidth - 10, 35); // x1, y1, x2, y2
  //
  //     // Add the content below the header
  //     pdf.addImage(imgData, 'PNG', 10, 40, pdfWidth - 20, pdfHeight);
  //     pdf.save(`Informe_Administracion_${new Date().toISOString().slice(0, 10)}.pdf`);
  //   }).catch((error) => {
  //     console.error('Error exporting to PDF:', error);
  //   });
  // }

  descargarComoPDF() {
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
      {id: 'loginsSection', title: 'Log de Ingresos al Sistema'},
      {id: 'turnosEspecialidadSection', title: 'Cantidad de Turnos por Especialidad'},
      {id: 'turnosDiaSection', title: 'Cantidad de Turnos por Día'},
      {id: 'turnosMedicoSection', title: 'Cantidad de Turnos Solicitado por Médico'},
      {id: 'turnosFinalizadosMedicoSection', title: 'Cantidad de Turnos Finalizados por Médico'},
    ];

    const addHeader = () => {
      pdf.addImage(logoUrl, 'PNG', 10, 10, 20, 20);
      pdf.setFontSize(14);
      pdf.text('Clínica Online - Informe administración', 40, 20);
      pdf.setFontSize(10);
      pdf.text(`Fecha de emisión: ${currentDateTime}`, 40, 26);
      pdf.line(10, 35, pdfWidth - 10, 35);
    };

    const captureSection = async (section: { id: string, title: string }) => {
      const sectionElement = document.getElementById(section.id);
      if (sectionElement) {
        const canvas = await html2canvas(sectionElement);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - 20; // Account for margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addPage();
        addHeader();
        pdf.setFontSize(12);
        pdf.text(section.title, 10, 40);
        pdf.addImage(imgData, 'PNG', 10, 50, imgWidth, imgHeight);
      }
    };

    addHeader();

    Promise.all(
      sections.map((section) => captureSection(section))
    ).then(() => {
      pdf.deletePage(1);
      pdf.save(`Informe_Administracion_${currentDateTime}.pdf`);
    }).catch((error) => {
      console.error('Error exporting to PDF:', error);
    });
  }
}
