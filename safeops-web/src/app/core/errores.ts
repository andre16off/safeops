import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';

// Mensaje para mostrar cuando una petición a la API falla.
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con la API. Verifica que el back-end esté en ejecución en localhost:8080.';
  }
  const mensaje = error.error?.mensaje;
  if (typeof mensaje === 'string' && mensaje) {
    return mensaje;
  }
  if (error.status === 403) {
    return 'Tu rol no permite realizar esta acción.';
  }
  if (error.status === 404) {
    return 'El registro solicitado no existe.';
  }
  return `La API respondió con un error (${error.status}). Intenta de nuevo.`;
}

// Lleva los errores por campo que devuelve la API (400) a los controles del formulario.
export function aplicarErroresDeApi(formulario: FormGroup, error: unknown): void {
  if (!(error instanceof HttpErrorResponse)) return;
  const errores = error.error?.errores;
  if (!errores || typeof errores !== 'object') return;
  for (const [campo, mensaje] of Object.entries(errores)) {
    formulario.get(campo)?.setErrors({ api: mensaje });
  }
}

// Mensaje de validación de un control, o null si es válido o aún no se tocó.
export function mensajeDeControl(control: AbstractControl | null, nombre: string): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) return null;
  const e = control.errors;
  if (e['required']) return `Ingresa ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}.`;
  if (e['minlength']) return `${nombre} debe tener al menos ${e['minlength'].requiredLength} caracteres.`;
  if (e['maxlength']) return `${nombre} admite como máximo ${e['maxlength'].requiredLength} caracteres.`;
  if (e['min']) return `${nombre} debe ser como mínimo ${e['min'].min}.`;
  if (e['max']) return `${nombre} debe ser como máximo ${e['max'].max}.`;
  if (e['pattern']) return `${nombre} solo admite letras, números, punto, guion y guion bajo.`;
  if (e['soloEspacios']) return `${nombre} no puede contener solo espacios.`;
  if (e['noCoincide']) return 'Las contraseñas no coinciden.';
  if (e['api']) return String(e['api']);
  return `${nombre} no es válido.`;
}

// Rechaza textos formados solo por espacios (la API los rechaza con @NotBlank).
export function sinSoloEspacios(control: AbstractControl) {
  const valor = control.value;
  return typeof valor === 'string' && valor.length > 0 && valor.trim().length === 0
    ? { soloEspacios: true }
    : null;
}
