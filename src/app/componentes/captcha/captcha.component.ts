import {Component, ViewChild, ElementRef, Output, EventEmitter, inject, AfterViewInit} from '@angular/core';
import {AlertService} from "../../services/alert.service";
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './captcha.component.html',
  styleUrl: './captcha.component.css'
})
export class CaptchaComponent implements AfterViewInit {

  @ViewChild('captchaCanvas') captchaCanvas!: ElementRef<HTMLCanvasElement>;
  captchaWidth: number = 200;
  captchaHeight: number = 80;
  captchaLength: number = 6;
  @Output() captchaValid: EventEmitter<boolean> = new EventEmitter<boolean>();

  captchaText: string = '';
  userInput: string = '';

  captchaInputControl: FormControl = new FormControl('', Validators.required);

  alertService: AlertService = inject(AlertService);

  ngAfterViewInit(): void {
    this.generarCaptcha();
  }

  /**
   * Genera un texto aleatorio para el captcha y lo renderiza sobre un canvas.
   */
  generarCaptcha(): void {
    this.captchaText = this.generarTextoAleatorio(this.captchaLength);
    this.renderCaptcha();
  }

  /**
   * Genera un texto aleatorio y alfanumerico.
   * @param length Length of the generated string
   * @returns Random string
   */
  private generarTextoAleatorio(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for(let i =0; i<length; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

  /**
   * Renderiza el texto del captcha en el canvas como una imagen con distorciones.
   */
  private renderCaptcha(): void {
    const canvas = this.captchaCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous CAPTCHA
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add random lines for noise
    for(let i=0; i<10; i++) {
      ctx.strokeStyle = this.generarColorAleatorio();
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Set text properties
    ctx.font = '30px Arial';
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';

    // Apply random rotation
    const angle = (Math.random() - 0.5) * (Math.PI / 4); // Rotate between -22.5 to 22.5 degrees
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.textAlign = 'center';
    ctx.fillText(this.captchaText, 0, 0);
    ctx.restore();

    // Add random dots for additional noise
    for(let i=0; i<50; i++) {
      ctx.fillStyle = this.generarColorAleatorio();
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  /**
   * Genera un color aleatorio.
   * @returns Random hex color string
   */
  private generarColorAleatorio(alpha: number = 0.7): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for(let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    if(alpha < 1) {
      // Convert hex to RGB
      const bigint = parseInt(color.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return color;
  }

  /**
   * Valida el captcha
   */
  validarCaptcha(): void {
    const userInput = this.captchaInputControl.value;
    const isValid = userInput === this.captchaText;
    if (isValid) {
      this.alertService.customAlert(
        'Captcha correcto!',
        'Continua con el registro de tu usuario.',
        'success'
      );
      this.captchaValid.emit(true);
    } else {
      this.alertService.customAlert(
        'CAPTCHA incorrecto!',
        'Por favor, intenta nuevamente.',
        'error'
      );
      this.captchaInputControl.reset();
      this.generarCaptcha(); // Regenerate CAPTCHA on failure
      this.captchaValid.emit(false);
    }
  }

  /**
   * Actualiza la imagen del captcha con un nuevo texto
   */
  actualizarCaptcha(): void {
    this.generarCaptcha();
    this.userInput = '';
  }
}
