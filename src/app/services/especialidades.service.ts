import {Injectable} from '@angular/core';
import {Firestore, collection, addDoc, collectionData} from '@angular/fire/firestore';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {
  private readonly especialidadesCollection;

  constructor(
    private firestore: Firestore
  ) {
    this.especialidadesCollection = collection(this.firestore, 'especialidades');
  }

  /**
   * Obtiene una lista de especialidades desde la colección de datos.
   *
   * @return {Observable<string[]>} Un observable que emite un array de strings conteniendo los nombres de las especialidades.
   */
  getEspecialidades(): Observable<string[]> {
    return collectionData(this.especialidadesCollection, {idField: 'id'}).pipe(
      map((especialidades: any[]) => especialidades.map(especialidad => especialidad.name)) // Extract only the name field
    );
  }

  /**
   * Agrega una nueva especialidad a la colección de especialidades.
   *
   * @param {string} especialidad - El nombre de la especialidad que se va a agregar.
   * @return {Promise<void>} - Una promesa que se resuelve cuando la especialidad es agregada exitosamente.
   */
  async addEspecialidad(especialidad: string): Promise<void> {
    await addDoc(this.especialidadesCollection, {name: especialidad});
  }
}
