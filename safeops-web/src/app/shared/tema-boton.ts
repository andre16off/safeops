import { Component, inject } from '@angular/core';
import { TemaService } from '../core/tema.service';

// Botón para cambiar entre tema claro y oscuro.
@Component({
  selector: 'app-tema-boton',
  template: `
    <button type="button" class="tema" [attr.aria-pressed]="tema.tema() === 'oscuro'" (click)="tema.alternar()">
      <span class="tema__icono" aria-hidden="true">{{ tema.tema() === 'oscuro' ? '☀' : '☾' }}</span>
      {{ tema.tema() === 'oscuro' ? 'Tema claro' : 'Tema oscuro' }}
    </button>
  `,
  styles: `
    .tema {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-height: 2.25rem;
      padding: 0.25rem 0.75rem;
      border: 1px solid currentColor;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      opacity: 0.85;
    }

    .tema:hover {
      opacity: 1;
    }

    .tema__icono {
      font-size: 1rem;
      line-height: 1;
    }
  `,
})
export class TemaBoton {
  protected readonly tema = inject(TemaService);
}
