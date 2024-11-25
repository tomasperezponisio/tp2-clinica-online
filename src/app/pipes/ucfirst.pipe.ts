import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ucfirst',
  standalone: true
})
export class UcfirstPipe implements PipeTransform {

  transform(input: string): string | null {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
  }

}
