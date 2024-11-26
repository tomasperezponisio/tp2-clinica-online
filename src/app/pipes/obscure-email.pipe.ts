import { Pipe, PipeTransform } from '@angular/core';

/**
 * Clase ObscureEmailPipe
 *
 * Un pipe de Angular que transforma una dirección de correo electrónico anonimizada.
 * Obscurece la parte local del correo electrónico dejando solo el primer carácter visible
 * seguido de tres asteriscos y la parte del dominio sin cambios.
 *
 * @Pipe ObscureEmailPipe
 */
@Pipe({
  name: 'obscureEmail',
  standalone: true
})
export class ObscureEmailPipe implements PipeTransform {

  transform(email: string): string {
    const [localPart, domain] = email.split('@');
    return `${localPart.charAt(0)}***@${domain}`;
  }

}
