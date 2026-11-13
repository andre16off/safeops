import { Component, inject } from '@angular/core';
import { AvisosService } from '../core/avisos.service';

// Muestra las notificaciones de AvisosService en una esquina de la pantalla.
@Component({
  selector: 'app-avisos-flotantes',
  template: `
    <div class="flotantes" aria-live="polite">
      @for (aviso of avisos.avisos(); track aviso.id) {
        <div class="flotante" [class]="'flotante--' + aviso.tipo" [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'">
          <span class="flotante__marca" aria-hidden="true">{{ aviso.tipo === 'exito' ? '✓' : '!' }}</span>
          <span class="flotante__texto">{{ aviso.texto }}</span>
          <button type="button" class="flotante__cerrar" aria-label="Cerrar aviso" (click)="avisos.cerrar(aviso.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .flotantes {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 20;
      display: grid;
      gap: 0.5rem;
      width: min(24rem, calc(100vw - 2rem));
    }

    .flotante {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.75rem 0.75rem 1rem;
      background: var(--panel);
      color: var(--tinta);
      border: 1px solid var(--borde);
      border-left: 6px solid var(--bajo);
      border-radius: 4px;
      box-shadow: var(--sombra);
      font-weight: 500;
      animation: entrar 180ms ease-out;
    }

    .flotante--error {
      border-left-color: var(--alto);
    }

    .flotante__marca {
      display: grid;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--bajo);
      color: var(--sobre-bajo);
      font-weight: 700;
      font-size: 0.875rem;
    }

    .flotante--error .flotante__marca {
      background: var(--alto);
      color: var(--sobre-alto);
    }

    .flotante__cerrar {
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: var(--acero);
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
    }

    .flotante__cerrar:hover {
      background: var(--concreto);
      color: var(--tinta);
    }

    @keyframes entrar {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
    }
  `,
})
export class AvisosFlotantes {
  protected readonly avisos = inject(AvisosService);
}
