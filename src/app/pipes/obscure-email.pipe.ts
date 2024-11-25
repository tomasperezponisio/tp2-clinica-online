import { Pipe, PipeTransform } from '@angular/core';

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
