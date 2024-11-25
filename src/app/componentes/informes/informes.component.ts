import {Component, OnInit} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ReportesService } from '../../services/reportes.service';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from '@angular/common';

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


}
