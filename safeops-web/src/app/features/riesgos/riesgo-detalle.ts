import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeDeError } from '../../core/errores';
import { Riesgo } from '../../core/models';
import { RiesgoService } from '../../core/riesgo.service';
import { MatrizRiesgo } from '../../shared/matriz-riesgo';
import { NivelInsignia } from '../../shared/nivel-insignia';

// Detalle de un riesgo, con su ubicación en la matriz.
@Component({
  selector: 'app-riesgo-detalle',
  imports: [RouterLink, MatrizRiesgo, NivelInsignia],
  templateUrl: './riesgo-detalle.html',
  styleUrl: './riesgo-detalle.scss',
})
export class RiesgoDetalle {
  private readonly riesgoService = inject(RiesgoService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly riesgo = signal<Riesgo | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmando = signal(false);
  protected readonly eliminando = signal(false);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.cargando.set(true);
      this.error.set(null);
      this.riesgoService.obtener(id).subscribe({
        next: (riesgo) => {
          this.riesgo.set(riesgo);
          this.cargando.set(false);
        },
        error: (e) => {
          this.riesgo.set(null);
          this.error.set(mensajeDeError(e));
          this.cargando.set(false);
        },
      });
    });
  }

  protected eliminar(riesgo: Riesgo): void {
    this.eliminando.set(true);
    this.error.set(null);
    this.riesgoService.eliminar(riesgo.id).subscribe({
      next: () => {
        this.avisos.exito(`Riesgo «${riesgo.peligro}» eliminado.`);
        this.router.navigate(['/areas', riesgo.area.id, 'riesgos']);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.confirmando.set(false);
        this.eliminando.set(false);
      },
    });
  }
}
