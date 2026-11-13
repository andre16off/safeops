import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AreaService } from '../../core/area.service';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Area, ETIQUETA_NIVEL, Nivel, Riesgo } from '../../core/models';
import { RiesgoService } from '../../core/riesgo.service';
import { MatrizRiesgo } from '../../shared/matriz-riesgo';
import { NivelInsignia } from '../../shared/nivel-insignia';

interface ResumenArea {
  area: Area;
  alto: number;
  medio: number;
  bajo: number;
  total: number;
}

// Panel de inicio: resumen de los riesgos registrados por nivel, por celda de la matriz y por área.
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, MatrizRiesgo, NivelInsignia],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly areaService = inject(AreaService);
  private readonly riesgoService = inject(RiesgoService);
  protected readonly auth = inject(AuthService);

  protected readonly etiquetaNivel = ETIQUETA_NIVEL;
  // De mayor a menor gravedad: el orden en que se leen las tarjetas y las barras.
  protected readonly niveles: Nivel[] = ['ALTO', 'MEDIO', 'BAJO'];

  private readonly areas = signal<Area[]>([]);
  private readonly riesgos = signal<Riesgo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly totalRiesgos = computed(() => this.riesgos().length);
  protected readonly totalAreas = computed(() => this.areas().length);

  protected readonly porNivel = computed(() => {
    const conteo: Record<Nivel, number> = { ALTO: 0, MEDIO: 0, BAJO: 0 };
    for (const r of this.riesgos()) conteo[r.nivel]++;
    return conteo;
  });

  // Cantidad de riesgos por celda de la matriz, con clave "probabilidad-impacto".
  protected readonly porCelda = computed(() => {
    const conteo: Record<string, number> = {};
    for (const r of this.riesgos()) {
      const clave = `${r.probabilidad}-${r.impacto}`;
      conteo[clave] = (conteo[clave] ?? 0) + 1;
    }
    return conteo;
  });

  protected readonly porArea = computed<ResumenArea[]>(() =>
    this.areas().map((area) => {
      const propios = this.riesgos().filter((r) => r.area.id === area.id);
      const contar = (nivel: Nivel) => propios.filter((r) => r.nivel === nivel).length;
      return { area, alto: contar('ALTO'), medio: contar('MEDIO'), bajo: contar('BAJO'), total: propios.length };
    }),
  );

  protected readonly maximoPorArea = computed(() => Math.max(1, ...this.porArea().map((a) => a.total)));

  // Riesgos de nivel alto, del mayor al menor producto de probabilidad por impacto.
  protected readonly altos = computed(() =>
    this.riesgos()
      .filter((r) => r.nivel === 'ALTO')
      .sort((a, b) => b.probabilidad * b.impacto - a.probabilidad * a.impacto)
      .slice(0, 5),
  );

  constructor() {
    forkJoin({ areas: this.areaService.listar(), riesgos: this.riesgoService.listar() }).subscribe({
      next: ({ areas, riesgos }) => {
        this.areas.set(areas);
        this.riesgos.set(riesgos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  // Ancho de un segmento de barra, en porcentaje del área con más riesgos.
  protected ancho(cantidad: number): string {
    return `${(cantidad / this.maximoPorArea()) * 100}%`;
  }

  protected detalle(a: ResumenArea): string {
    const partes = [
      a.alto ? `${a.alto} ${a.alto === 1 ? 'alto' : 'altos'}` : '',
      a.medio ? `${a.medio} ${a.medio === 1 ? 'medio' : 'medios'}` : '',
      a.bajo ? `${a.bajo} ${a.bajo === 1 ? 'bajo' : 'bajos'}` : '',
    ].filter(Boolean);
    return partes.length ? partes.join(', ') : 'Sin riesgos registrados';
  }
}
