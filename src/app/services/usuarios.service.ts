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

  private fetchUserData(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, 'usuarios', uid);
    return docData(userDocRef).pipe(
      catchError((error) => {
        console.error('Error fetching user data:', error);
        return of(null);
      })
    );
  }

  traerUsuarios(): Observable<any[]> {
    return collectionData(this.usuariosCollection, { idField: 'uid' }) as Observable<any[]>;
  }

  actualizarVerificado(uid: string, verificado: boolean): Promise<void> {
    const userDoc = doc(this.firestore, `usuarios/${uid}`);
    return updateDoc(userDoc, { verificado });
  }

  // Update user data
  actualizarDataDeUsuario(userData: any): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const userDocRef = doc(this.firestore, 'usuarios', user.uid);
      return setDoc(userDocRef, userData, { merge: true });
    } else {
      return Promise.reject('No user is currently logged in.');
    }
  }

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

  traerDataDeUsuario(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, 'usuarios', uid);
    return docData(userDocRef);
  }

  // Add this method to fetch all pacientes
  traerPacientes(): Observable<any[]> {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const q = query(usuariosRef, where('tipo', '==', 'paciente'));
    return collectionData(q, { idField: 'uid' }) as Observable<any[]>;
  }

}
