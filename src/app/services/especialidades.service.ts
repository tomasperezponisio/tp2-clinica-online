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

  getEspecialidades(): Observable<string[]> {
    return collectionData(this.especialidadesCollection, {idField: 'id'}).pipe(
      map((especialidades: any[]) => especialidades.map(especialidad => especialidad.name)) // Extract only the name field
    );
  }

  async addEspecialidad(especialidad: string): Promise<void> {
    await addDoc(this.especialidadesCollection, {name: especialidad});
  }
}
