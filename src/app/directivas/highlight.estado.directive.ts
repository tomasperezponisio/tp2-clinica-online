import {Directive, ElementRef, Renderer2, Input, OnInit, RendererStyleFlags2} from '@angular/core';

/**
 * Directiva Angular para resaltar el fondo de un elemento basado en el estado proporcionado.
 *
 * Esta directiva cambia el color de fondo del elemento donde se aplica
 * basándose en el valor del estado. Los colores están predefinidos para
 * ciertos estados específicos como 'pendiente', 'aceptado', 'rechazado',
 * 'cancelado' y 'realizado'. Si el estado proporcionado no coincide con
 * ninguno de estos, se aplica un color gris claro por defecto.
 *
 * @directive
 * @selector [appHighlightEstado]
 *
 * @input estado - El estado utilizado para determinar el color de fondo del elemento.
 *                  Los valores posibles son:
 *                  - 'pendiente' -> Naranja Claro
 *                  - 'aceptado' -> Azul Claro
 *                  - 'rechazado' -> Rojo Claro
 *                  - 'cancelado' -> Gris Claro
 *                  - 'realizado' -> Verde Claro
 *                  - Ó cualquier otro valor que resultará en un color gris claro por defecto.
 */
@Directive({
  selector: '[appHighlightEstado]',
  standalone: true,
})
export class HighlightEstadoDirective implements OnInit {
  @Input('appHighlightEstado') estado: string | undefined;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (this.estado) {
      let color = '';
      switch (this.estado.toLowerCase()) {
        case 'pendiente':
          color = 'rgba(255, 165, 0, 0.2)'; // Light Orange
          break;
        case 'aceptado':
          color = 'rgba(0, 0, 255, 0.2)'; // Light Blue
          break;
        case 'rechazado':
          color = 'rgba(255, 0, 0, 0.2)'; // Light Red
          break;
        case 'cancelado':
          color = 'rgba(128, 128, 128, 0.2)'; // Light Gray
          break;
        case 'realizado':
          color = 'rgba(0, 255, 0, 0.2)'; // Light Green
          break;
        default:
          color = 'rgba(211, 211, 211, 0.2)'; // Default Light Gray
      }
      this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
    }
  }
}
