export interface Turno {
  id?: string; // Firestore document ID
  pacienteUid: string;
  pacienteNombre: string;
  especialistaUid: string;
  especialistaNombre: string;
  especialidad: string;
  fecha: string; // Date in ISO format (e.g., '2023-04-15')
  hora: string; // Time in 'HH:mm' format (e.g., '14:00')
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado' | 'realizado';
  comentarioPaciente?: string; // For cancellation or feedback
  comentarioEspecialista?: string; // For cancellation, rejection, or diagnosis
  reseña?: string; // Specialist's notes after the appointment
  encuesta?: any; // Patient's survey after the appointment
  calificacion?: number; // Patient's rating
  comentarioAdmin?: string;
  historiaClinica?: {
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    dinamicos: { key: string; value: string }[];
  };
}
