   import { Directive, ElementRef, HostListener, Input } from '@angular/core';

   /**
    * Directiva Angular que reemplaza el texto de un elemento con una dirección de correo electrónico completa
    * cuando el puntero del ratón está sobre el elemento y lo restaura cuando el puntero sale.
    *
    * La directiva utiliza los eventos `mouseenter` y `mouseleave` para alterar el contenido del elemento.
    *
    * @selector [hoverEmail] - Atributo que se usa para aplicar la directiva a un elemento.
    *
    * @Input {string} hoverEmail - Dirección de correo electrónico completa que reemplazará el texto original del elemento.
    */
   @Directive({
     standalone: true,
     selector: '[hoverEmail]'
   })
   export class HoverEmailDirective {
     @Input('hoverEmail') fullEmail: string | undefined;
     private originalText: string | undefined;

     constructor(private el: ElementRef) {}

     @HostListener('mouseenter') onMouseEnter() {
       if (this.fullEmail) {
         this.originalText = this.el.nativeElement.textContent;
         this.el.nativeElement.textContent = this.fullEmail;
       }
     }

     @HostListener('mouseleave') onMouseLeave() {
       if (this.originalText) {
         this.el.nativeElement.textContent = this.originalText;
       }
     }
   }
