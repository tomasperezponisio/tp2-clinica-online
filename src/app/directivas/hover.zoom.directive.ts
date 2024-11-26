import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

/**
 * Directiva Angular que aplica un efecto de zoom al pasar el ratón sobre un elemento HTML.
 *
 * Utiliza los eventos `mouseenter` y `mouseleave` para cambiar el estilo del elemento,
 * aumentando y disminuyendo su tamaño respectivamente.
 *
 * Dependencias:
 * - `ElementRef`: Proporciona una referencia directa al elemento DOM.
 * - `Renderer2`: Permite manipular el DOM de manera segura en Angular.
 *
 * Decoradores:
 * - `@Directive`: Define esta clase como una directiva independiente con el selector `[appHoverZoom]`.
 * - `@HostListener('mouseenter')`: Detecta cuando el ratón entra en el área del elemento y aplica el estilo de zoom.
 * - `@HostListener('mouseleave')`: Detecta cuando el ratón sale del área del elemento y revierte el estilo.
 */
@Directive({
  standalone: true,
  selector: '[appHoverZoom]'
})
export class HoverZoomDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(3.0)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.3s');
    this.renderer.setStyle(this.el.nativeElement, 'z-index', '10');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
    this.renderer.setStyle(this.el.nativeElement, 'z-index', '0');
  }
}
