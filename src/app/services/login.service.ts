import {Injectable} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut, authState, User
} from '@angular/fire/auth';
import {addDoc, collection, doc, Firestore, getDoc, DocumentData,  query, where, getDocs } from "@angular/fire/firestore";
import {Paciente} from "../models/paciente";
import {from, map, Observable, of, switchMap} from "rxjs";
import {Especialista} from "../models/especialista";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  msjError: string = '';
  userData$: Observable<{ isLoggedIn: boolean, tipo?: string, nombre?: string }>;

  constructor(
    public auth: Auth,
    private firestore: Firestore
  ) {
    this.userData$ = authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (user && user.uid) {
          return this.fetchUserData(user.uid).pipe(
            map((data) => {
              return {
                isLoggedIn: true,
                tipo: data?.['tipo'],
                nombre: data?.['nombre']
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
    const usuariosCollection = collection(this.firestore, 'usuarios');
    const q = query(usuariosCollection, where('uid', '==', uid));

    return new Observable(observer => {
      getDocs(q)
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data(); // Get the first matching document
            observer.next(data);
          } else {
            observer.next(null);
          }
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(this.auth);
        return {success: false, message: 'Por favor verifica tu correo eléctronico para finalizar el registro.'};
      }
      return {success: true, message: 'Login exitoso!'};

    } catch (error) {
      // @ts-ignore
      switch (error.code) {
        case "auth/invalid-email":
          this.msjError = "Email no registrado";
          break;
        case "auth/user-not-found":
          this.msjError = "Email no registrado";
          break;
        case "auth/wrong-password":
          this.msjError = "Contraseña incorrecta";
          break;
        case "auth/invalid-credential":
          this.msjError = "Credenciales inválidas";
          break;
        default:
          this.msjError = "Error al loguearse";
          break;
      }
      // @ts-ignore
      return {success: false, message: this.msjError};
    }
  }

  async altaPaciente(email: string, password: string, paciente: Paciente): Promise<{
    success: boolean;
    message: string
  }> {
    try {
      // registro el paciente con el mail y contraseña
      const pacienteCreado = await createUserWithEmailAndPassword(this.auth, email, password);

      // me traigo el UID de Auth en la respuesta
      const uid = pacienteCreado.user?.uid;

      // guardo en la db el paciente con el UID asociado a su Auth, el tipo de usuario
      if (uid) {
        const tipo = 'paciente';
        const pacienteConUid = {...paciente, uid, tipo};
        let col = collection(this.firestore, 'usuarios');
        await addDoc(col, pacienteConUid);

        // envío correo de verificación
        await sendEmailVerification(pacienteCreado.user);

        // cierro sesión para evitar que quede logueado sin haber verificado el correo
        await signOut(this.auth);

        console.log('Paciente registrado y gurdado en la db.');

        return {success: true, message: 'Termina tu registro en el correo que te hemos enviado.'};
      } else {
        return {success: false, message: 'Error en Google Auth: UID es undefined.'};
      }

    } catch (error) {
      // @ts-ignore
      console.log(error.code);
      // @ts-ignore
      switch (error.code) {
        case "auth/invalid-email":
          this.msjError = "Email inválido";
          break;
        case "auth/email-already-exists":
          this.msjError = "Email ya registrado";
          break;
        case "auth/email-already-in-use":
          this.msjError = "Email ya registrado";
          break;
        case "auth/missing-password":
          this.msjError = "Ingrese una contraseña";
          break;
        case "auth/weak-password":
          this.msjError = "La contraseña es muy débil";
          break;
        default:
          this.msjError = "Error al registrarse";
          break;
      }
      // @ts-ignore
      return {success: false, message: this.msjError};
    }
  }

  async altaEspecialista(email: string, password: string, especialista: Especialista): Promise<{
    success: boolean;
    message: string
  }> {
    try {
      // registro el paciente con el mail y contraseña
      const especialistaCreado = await createUserWithEmailAndPassword(this.auth, email, password);

      // me traigo el UID de Auth en la respuesta
      const uid = especialistaCreado.user?.uid;

      // guardo en la db el paciente con el UID asociado a su Auth, el tipo de usuario y el atributo verificado en false
      if (uid) {
        const tipo = 'especialista';
        const verificado = false;
        const especialistaConUid = {...especialista, uid, tipo, verificado};
        let col = collection(this.firestore, 'usuarios');
        await addDoc(col, especialistaConUid);

        // envío correo de verificación
        await sendEmailVerification(especialistaCreado.user);

        // cierro sesión para evitar que quede logueado sin haber verificado el correo
        await signOut(this.auth);

        console.log('Especialista registrado y gurdado en la db.');

        return {success: true, message: 'Termina tu registro en el correo que te hemos enviado.'};
      } else {
        return {success: false, message: 'Error en Google Auth: UID es undefined.'};
      }

    } catch (error) {
      // @ts-ignore
      console.log(error.code);
      // @ts-ignore
      switch (error.code) {
        case "auth/invalid-email":
          this.msjError = "Email inválido";
          break;
        case "auth/email-already-exists":
          this.msjError = "Email ya registrado";
          break;
        case "auth/email-already-in-use":
          this.msjError = "Email ya registrado";
          break;
        case "auth/missing-password":
          this.msjError = "Ingrese una contraseña";
          break;
        case "auth/weak-password":
          this.msjError = "La contraseña es muy débil";
          break;
        default:
          this.msjError = "Error al registrarse";
          break;
      }
      // @ts-ignore
      return {success: false, message: this.msjError};
    }
  }



  async register(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      // logueo el usuario que ingresó
      return {success: true, message: 'Login exitoso!'};

    } catch (error) {
      // @ts-ignore
      console.log(error.code);
      // @ts-ignore
      switch (error.code) {
        case "auth/invalid-email":
          this.msjError = "Email inválido";
          break;
        case "auth/email-already-exists":
          this.msjError = "Email ya registrado";
          break;
        case "auth/email-already-in-use":
          this.msjError = "Email ya registrado";
          break;
        case "auth/missing-password":
          this.msjError = "Ingrese una contraseña";
          break;
        case "auth/weak-password":
          this.msjError = "La contraseña es muy débil";
          break;
        default:
          this.msjError = "Error al registrarse";
          break;
      }
      // @ts-ignore
      return {success: false, message: this.msjError};
    }
  }

}
