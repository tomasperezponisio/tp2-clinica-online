   import { Directive, ElementRef, HostListener, Input } from '@angular/core';

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
