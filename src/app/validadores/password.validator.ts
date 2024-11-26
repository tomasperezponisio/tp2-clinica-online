import { ValidatorFn, ValidationErrors, AbstractControl } from "@angular/forms";

/**
 * Valida que los campos de contraseña y verificación de contraseña en un formulario coincidan.
 *
 * @return {ValidatorFn} Una función de validación que comprueba si los campos de contraseña coinciden.
 *                        Devuelve un objeto de errores de validación si no coinciden, o null si lo hacen.
 */
export function passwordValidator(): ValidatorFn {

  return (formGroup: AbstractControl): ValidationErrors | null => {

    const password = formGroup.get('password');

    const passwordCheck = formGroup.get('passwordCheck');

    const respuestaError = { noCoincide: 'La contraseña no coincide' };

    if (password?.value !== passwordCheck?.value) {
      formGroup.get('passwordCheck')?.setErrors(respuestaError);
      // Si los campos de contraseña no coinciden, devolvemos un error de validación
      return respuestaError;

    } else {
      formGroup.get('passwordCheck')?.setErrors(null);
      // Si los campos de contraseña coinciden, la validación es correcta
      return null;
    }
  };
}
