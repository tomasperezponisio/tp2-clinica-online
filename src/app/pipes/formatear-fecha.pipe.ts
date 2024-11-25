import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'formatearFecha',
  standalone: true
})
export class FormatearFechaPipe implements PipeTransform {

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
