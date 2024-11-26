import {Injectable} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  UserCredential,
} from '@angular/fire/auth';
import {Firestore, DocumentData, doc, setDoc, getDoc, addDoc, collection} from "@angular/fire/firestore";
import {Paciente} from "../models/paciente";
import {Especialista} from "../models/especialista";
import {Admin} from "../models/admin";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  msjError: string = '';

  constructor(
    public auth: Auth,
    private firestore: Firestore
  ) {
  }

  /**
   * Inicia sesión de usuario con el email y la contraseña especificados.
   *
   * @param {string} email - El email del usuario.
   * @param {string} password - La contraseña del usuario.
   * @return {Promise<{ success: boolean, message: string }>} Un objeto que indica si el inicio de sesión fue exitoso y un mensaje correspondiente.
   */
  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const userId: string = userCredential.user.uid;

      const userDocRef = doc(this.firestore, 'usuarios', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(this.auth);
        return {success: false, message: 'Usuario no encontrado en la base de datos.'};
      }

      const userData: DocumentData = userDocSnap.data()!;
      const userTipo: string = userData['tipo'];
      const userVerificado: boolean = userData['verificado'];

      if (userTipo === 'especialista' && !userVerificado) {
        await signOut(this.auth);
        return {success: false, message: 'Su usuario no ha sido verificado. Por favor contacte con el administrador.'};
      }

      if (userTipo !== 'admin' && !userCredential.user.emailVerified) {
        await signOut(this.auth);
        return {success: false, message: 'Por favor verifica tu correo eléctronico para finalizar el registro.'};
      }
      // logueo el usuario que ingresó
      let col = collection(this.firestore, 'logins');
      await addDoc(col, {
        fecha: new Date(),
        "email": email,
        "nombreYApellido": userData['nombre'] + " " + userData['apellido'],
        "tipo": userTipo,
      });
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
      return {success: false, message: this.msjError};
    }
  }

  /**
   * Registra y guarda un paciente en la base de datos, además de enviar un correo de verificación
   * y cerrar sesión para que el usuario no quede logueado sin haber verificado su correo.
   *
   * @param {string} email - El correo electrónico del paciente.
   * @param {string} password - La contraseña del paciente.
   * @param {Paciente} paciente - El objeto que contiene los datos del paciente.
   * @return {Promise<{success: boolean, message: string}>} - Resultado de la operación con un mensaje correspondiente.
   */
  async altaPaciente(email: string, password: string, paciente: Paciente): Promise<{
    success: boolean;
    message: string
  }> {
    try {
      // registro el paciente con el mail y contraseña
      const pacienteCreado: UserCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      // me traigo el UID de Auth en la respuesta
      const uid: string | undefined = pacienteCreado.user?.uid;

      // guardo en la db el paciente con el UID asociado a su Auth, el tipo de usuario
      if (uid) {
        const pacienteConUid = {...paciente, uid};
        const userDocRef = doc(this.firestore, 'usuarios', uid);
        await setDoc(userDocRef, pacienteConUid);

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

  /**
   * Registra un nuevo especialista con los datos proporcionados, guarda la información en la base de datos
   * y envía un correo de verificación. Posteriormente, cierra la sesión para evitar que el usuario quede logueado
   * sin haber verificado su correo electrónico.
   *
   * @param {string} email - El correo electrónico del especialista.
   * @param {string} password - La contraseña del especialista.
   * @param {Especialista} especialista - Un objeto que contiene la información del especialista.
   * @return {Promise<{success: boolean, message: string}>} Un objeto indicativo del éxito de la operación
   * junto con un mensaje relevante.
   */
  async altaEspecialista(email: string, password: string, especialista: Especialista): Promise<{
    success: boolean;
    message: string
  }> {
    try {
      console.log('En el service');
      console.log('especialista: ', especialista);

      // registro el paciente con el mail y contraseña
      const especialistaCreado = await createUserWithEmailAndPassword(this.auth, email, password);

      // me traigo el UID de Auth en la respuesta
      const uid: string | undefined = especialistaCreado.user?.uid;

      // guardo en la db el paciente con el UID asociado a su Auth, el tipo de usuario y el atributo verificado en false
      if (uid) {
        // const especialistaConUid = {...especialista, uid};
        // Crear un objeto plano con los datos del especialista
        const especialistaConUid = {
          nombre: especialista.nombre,
          apellido: especialista.apellido,
          edad: especialista.edad,
          dni: especialista.dni,
          especialidad: especialista.especialidad,
          email: especialista.email,
          imagenUno: especialista.imagenUno,
          tipo: especialista.tipo, // 'especialista'
          verificado: especialista.verificado, // false por defecto
          disponibilidad: especialista.disponibilidad, // []
          uid: uid
        };

        console.log('especialistaConUid: ', especialistaConUid);

        // Referencia al documento en Firestore
        const userDocRef = doc(this.firestore, 'usuarios', uid);
        console.log('userDocRef: ', userDocRef);

        await setDoc(userDocRef, especialistaConUid);

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
      console.error('Error en altaEspecialista:', error);

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

  /**
   * Registra un nuevo administrador en el sistema utilizando una dirección de correo electrónico y una contraseña.
   * Crea una entrada en la base de datos Firestore asociada con el UID del administrador recién creado.
   * Envía un correo electrónico de verificación y cierra la sesión para que el usuario no permanezca autenticado sin verificar.
   *
   * @param {string} email - La dirección de correo electrónico del nuevo administrador.
   * @param {string} password - La contraseña asociada con la cuenta del nuevo administrador.
   * @param {Admin} admin - Objeto que contiene la información adicional del administrador que se guardará en la base de datos.
   * @return {Promise<{success: boolean, message: string}>} Un objeto indicando el éxito de la operación y un mensaje asociado.
   */
  async altaAdmin(email: string, password: string, admin: Admin): Promise<{
    success: boolean;
    message: string
  }> {
    try {
      // registro el admin con el mail y contraseña
      const adminCreado = await createUserWithEmailAndPassword(this.auth, email, password);

      // me traigo el UID de Auth en la respuesta
      const uid = adminCreado.user?.uid;

      // guardo en la db el admin con el UID asociado a su Auth, el tipo de usuario
      if (uid) {
        const adminConUid = {...admin, uid};
        const userDocRef = doc(this.firestore, 'usuarios', uid);
        await setDoc(userDocRef, adminConUid);

        // envío correo de verificación
        await sendEmailVerification(adminCreado.user);

        // cierro sesión para evitar que quede logueado sin haber verificado el correo
        await signOut(this.auth);

        console.log('Admin registrado y gurdado en la db.');

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


  /**
   * Registra un nuevo usuario con el email y contraseña proporcionados.
   *
   * @param {string} email - La dirección de correo electrónico del usuario que se registrará.
   * @param {string} password - La contraseña del usuario que se registrará.
   * @return {Promise<{ success: boolean; message: string }>} Un objeto que indica si el registro fue exitoso y un mensaje asociado.
   */
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
