import {Injectable} from '@angular/core';
import {
  collection,
  collectionData,
  doc, docData,
  Firestore,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from '@angular/fire/firestore';
import {from, map, Observable, of, switchMap} from 'rxjs';
import {Auth, authState, User} from "@angular/fire/auth";
import {catchError} from "rxjs/operators";
import {Especialista} from "../models/especialista";

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly usuariosCollection;

  userData$: Observable<any>;

  constructor(
    public auth: Auth,
    private firestore: Firestore
  ) {
    this.usuariosCollection = collection(this.firestore, 'usuarios');

    this.userData$ = authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (user && user.uid) {
          return this.fetchUserData(user.uid).pipe(
            map((data) => {
              return {
                isLoggedIn: true,
                ...data
              };
            })
          );
        } else {
          return of({isLoggedIn: false});
        }
      })
    );
  }

  /**
   * Obtiene los datos del usuario desde la base de datos Firestore.
   *
   * @param {string} uid - El identificador único del usuario.
   * @return {Observable<any>} Un Observable que emite los datos del usuario.
   */
  private fetchUserData(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, 'usuarios', uid);
    return docData(userDocRef).pipe(
      catchError((error) => {
        console.error('Error fetching user data:', error);
        return of(null);
      })
    );
  }

  /**
   * Recupera la lista de usuarios desde la colección de Firestore.
   *
   * @return {Observable<any[]>} Un observable que emite una lista de objetos de usuario.
   */
  traerUsuarios(): Observable<any[]> {
    return collectionData(this.usuariosCollection, { idField: 'uid' }) as Observable<any[]>;
  }

  /**
   * Actualiza el estado de verificación de un usuario en la base de datos.
   *
   * @param {string} uid - El identificador único del usuario.
   * @param {boolean} verificado - El nuevo estado de verificación del usuario.
   * @return {Promise<void>} Una promesa que se resuelve cuando la actualización se completa.
   */
  actualizarVerificado(uid: string, verificado: boolean): Promise<void> {
    const userDoc = doc(this.firestore, `usuarios/${uid}`);
    return updateDoc(userDoc, { verificado });
  }

  /**
   * Actualiza los datos del usuario actualmente autenticado en la base de datos.
   *
   * @param {Object} userData - Los nuevos datos del usuario que se desean guardar.
   * @return {Promise<void>} Una promesa que se resuelve cuando los datos del usuario han sido actualizados.
   */
  actualizarDataDeUsuario(userData: any): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const userDocRef = doc(this.firestore, 'usuarios', user.uid);
      return setDoc(userDocRef, userData, { merge: true });
    } else {
      return Promise.reject('No user is currently logged in.');
    }
  }

  /**
   * Obtiene un listado único de especialidades de los usuarios que son especialistas.
   *
   * @return {Observable<string[]>} Un observable que emite un arreglo de cadenas con las especialidades únicas.
   */
  traerEspecialidades(): Observable<string[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef, where('tipo', '==', 'especialista'));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        const especialidadesSet = new Set<string>();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data['especialidad']) {
            data['especialidad'].forEach((esp: string) => especialidadesSet.add(esp));
          }
        });
        return Array.from(especialidadesSet);
      })
    );
  }

  /**
   * Trae una lista de especialistas que coincidan con la especialidad pasada como parámetro.
   *
   * @param {string} especialidad - La especialidad por la cual se filtrarán los especialistas.
   * @return {Observable<Especialista[]>} Un observable que emite un array de objetos de tipo Especialista.
   */
  traerEspecialistasPorEspecialidad(especialidad: string): Observable<Especialista[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(
      usuariosRef,
      where('tipo', '==', 'especialista'),
      where('especialidad', 'array-contains', especialidad)
    );
    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return new Especialista(
            data['nombre'],
            data['apellido'],
            data['edad'],
            data['dni'],
            data['especialidad'],
            data['email'],
            data['imagenUno'],
            data['tipo'],
            data['verificado'],
            data['disponibilidad'],
            data['uid'] || doc.id // Use data['uid'] or doc.id
          );
        });
      })
    );
  }

  /**
   * Obtiene los datos de un usuario específico desde Firestore.
   *
   * @param {string} uid - El identificador único del usuario cuyos datos se desean obtener.
   * @return {Observable<any>} - Un observable que emite los datos del usuario.
   */
  traerDataDeUsuario(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, 'usuarios', uid);
    return docData(userDocRef);
  }

  /**
   * Este método obtiene una lista de pacientes desde la colección 'usuarios' en Firestore.
   * Filtra los documentos donde el campo 'tipo' es igual a 'paciente'.
   * La lista de pacientes incluye el campo 'uid' como identificador.
   *
   * @return {Observable<any[]>} Un observable que emite una lista de objetos representando a los pacientes.
   */
  traerPacientes(): Observable<any[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef, where('tipo', '==', 'paciente'));
    return collectionData(q, { idField: 'uid' }) as Observable<any[]>;
  }

}
