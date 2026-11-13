import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TemaService } from './core/tema.service';
import { AvisosFlotantes } from './shared/avisos-flotantes';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisosFlotantes],
  template: `
    <router-outlet />
    <app-avisos-flotantes />
  `,
})
export class App {
  // Aplica el tema guardado al iniciar la aplicación.
  private readonly tema = inject(TemaService);
}
