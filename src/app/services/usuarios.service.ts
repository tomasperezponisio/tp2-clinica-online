import { Injectable } from '@angular/core';
import {Firestore, collection, doc, getDocs, updateDoc, query, collectionData} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private usuariosCollection;

  constructor(
    private firestore: Firestore
  ) {
    this.usuariosCollection = collection(this.firestore, 'usuarios');
  }

  getUsuarios(): Observable<any[]> {
    // return getDocs(query(this.usuariosCollection)).pipe(
    //   map((snapshot) =>
    //     snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
    //   )
    // );
    return collectionData(this.usuariosCollection, { idField: 'uid' }) as Observable<any[]>;

  }



  updateVerificado(uid: string, verificado: boolean): Promise<void> {
    const userDoc = doc(this.firestore, `usuarios/${uid}`);
    return updateDoc(userDoc, { verificado });
  }
}
