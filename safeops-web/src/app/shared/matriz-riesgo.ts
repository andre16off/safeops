import { Component, input, output } from '@angular/core';
import { ETIQUETA_NIVEL, calcularNivel } from '../core/models';

export interface CeldaMatriz {
  probabilidad: number;
  impacto: number;
}

// Matriz de riesgo 5 × 5 (probabilidad × impacto). Tiene tres usos:
// - mostrar la celda de un riesgo (probabilidad e impacto),
// - elegir una celda con un clic (editable),
// - mostrar cuántos riesgos hay en cada celda (conteos).
@Component({
  selector: 'app-matriz-riesgo',
  templateUrl: './matriz-riesgo.html',
  styleUrl: './matriz-riesgo.scss',
})
export class MatrizRiesgo {
  readonly probabilidad = input<number | null>(null);
  readonly impacto = input<number | null>(null);
  readonly editable = input(false);
  // Cantidad de riesgos por celda, con clave "probabilidad-impacto".
  readonly conteos = input<Record<string, number> | null>(null);
  readonly elegir = output<CeldaMatriz>();

  protected readonly filas = [5, 4, 3, 2, 1];
  protected readonly columnas = [1, 2, 3, 4, 5];

  protected seleccionada(p: number, i: number): boolean {
    return this.probabilidad() === p && this.impacto() === i;
  }

  protected conteo(p: number, i: number): number {
    return this.conteos()?.[`${p}-${i}`] ?? 0;
  }

  protected texto(p: number, i: number): string | number {
    if (!this.conteos()) return p * i;
    return this.conteo(p, i) || '';
  }

  protected clase(p: number, i: number): string {
    const nivel = calcularNivel(p, i).toLowerCase();
    const activa = this.conteos() ? this.conteo(p, i) > 0 : this.seleccionada(p, i);
    const marco = this.seleccionada(p, i) ? ' celda--seleccionada' : '';
    return `celda celda--${nivel}${activa ? ' celda--activa' : ''}${marco}`;
  }

  protected descripcion(p: number, i: number): string {
    const base = `Probabilidad ${p}, impacto ${i}: nivel ${ETIQUETA_NIVEL[calcularNivel(p, i)].toLowerCase()}`;
    if (!this.conteos()) return base;
    const n = this.conteo(p, i);
    return `${base}, ${n} ${n === 1 ? 'riesgo' : 'riesgos'}`;
  }
}
