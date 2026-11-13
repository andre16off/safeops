import { Component, computed, input } from '@angular/core';
import { ETIQUETA_NIVEL, Nivel } from '../core/models';

// Etiqueta de color con el nivel de un riesgo.
@Component({
  selector: 'app-nivel-insignia',
  template: `<span class="insignia" [class]="'insignia--' + nivel().toLowerCase()">{{ etiqueta() }}</span>`,
})
export class NivelInsignia {
  readonly nivel = input.required<Nivel>();
  protected readonly etiqueta = computed(() => ETIQUETA_NIVEL[this.nivel()]);
}
