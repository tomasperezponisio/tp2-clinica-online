import { Injectable } from '@angular/core';
import Swal from "sweetalert2";

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  /**
   * Alertas personalizadas
   *
   * @param titulo el texto del titulo
   * @param mensaje el texto del alert
   * @param icon success para exito, error para error
   * @private
   */
  public customAlert(titulo: string, mensaje: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question') {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: icon,
      confirmButtonText: 'OK'
    });
  }

  public customPrompt(titulo: string, inputLabel: string) {
    return Swal.fire({
      title: titulo,
      input: "text",
      inputLabel: inputLabel,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      // @ts-ignore
      inputValidator: (value) => {
        if (!value) {
          return "Hay que ingresar algo!";
        }
      }
    });
  }

  /**
   * Custom Confirm using SweetAlert2
   *
   * @param titulo Title text
   * @param mensaje Message text
   * @returns Promise that resolves with the user's action
   */
  public customConfirm(titulo: string, mensaje: string) {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    });
  }
}
