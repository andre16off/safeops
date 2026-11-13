import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AreaService } from '../../core/area.service';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeDeError } from '../../core/errores';
import { Area } from '../../core/models';

@Component({
  selector: 'app-areas-lista',
  imports: [RouterLink],
  templateUrl: './areas-lista.html',
  styleUrl: './areas-lista.scss',
})
export class AreasLista {
  private readonly areaService = inject(AreaService);
  protected readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);

  protected readonly areas = signal<Area[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<number | null>(null);
  protected readonly eliminando = signal(false);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.areaService.listar().subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected eliminar(area: Area): void {
    this.eliminando.set(true);
    this.error.set(null);
    this.areaService.eliminar(area.id).subscribe({
      next: () => {
        this.areas.update((lista) => lista.filter((a) => a.id !== area.id));
        this.avisos.exito(`Área «${area.nombre}» eliminada.`);
        this.porEliminar.set(null);
        this.eliminando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.porEliminar.set(null);
        this.eliminando.set(false);
      },
    });
  }
}
