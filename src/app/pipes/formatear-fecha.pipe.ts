import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'formatearFecha',
  standalone: true
})
export class FormatearFechaPipe implements PipeTransform {

  /**
   * Transforma una cadena o un objeto Date en una cadena de fecha localizada.
   *
   * @param {string | Date} value - El valor que se va a transformar. Puede ser una cadena con formato de fecha o un objeto Date.
   * @param {string} [locale='en-US'] - El locale que se usará para formatear la fecha. El valor predeterminado es 'en-US'.
   * @return {string} La representación de la fecha en el formato especificado por el locale.
   */
  transform(value: string | Date, locale: string = 'en-US'): string {
    let date: Date;

    if (typeof value === 'string') {
      date = new Date(value); // Parse string to Date
    } else {
      date = value;
    }

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

}
