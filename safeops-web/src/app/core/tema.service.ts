import { Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';
const CLAVE_TEMA = 'safeops.tema';

// Tema claro u oscuro. Recuerda la elección del usuario; si no hay,
// usa la preferencia del sistema operativo.
@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly tema = signal<Tema>(this.temaInicial());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar(): void {
    const nuevo: Tema = this.tema() === 'claro' ? 'oscuro' : 'claro';
    this.tema.set(nuevo);
    this.aplicar(nuevo);
    try {
      localStorage.setItem(CLAVE_TEMA, nuevo);
    } catch {
      // Sin acceso a localStorage: el tema dura hasta recargar la página.
    }
  }

  private temaInicial(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE_TEMA);
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch {
      // Se usa la preferencia del sistema.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }

  private aplicar(tema: Tema): void {
    document.documentElement.dataset['tema'] = tema;
  }
}
