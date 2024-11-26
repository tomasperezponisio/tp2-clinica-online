import { Pipe, PipeTransform } from '@angular/core';

/**
 * UcfirstPipe es una clase que implementa la interfaz PipeTransform.
 *
 * Este pipe toma una cadena de texto como entrada y transforma la
 * primera letra a mayúscula y el resto de las letras a minúsculas.
 *
 * @class
 */
@Pipe({
  name: 'ucfirst',
  standalone: true
})
export class UcfirstPipe implements PipeTransform {

  transform(input: string): string | null {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
  }

}
