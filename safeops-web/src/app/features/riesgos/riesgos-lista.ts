import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { AreaService } from '../../core/area.service';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeDeError } from '../../core/errores';
import { Area, ETIQUETA_NIVEL, NIVELES, Nivel, ORDEN_NIVEL, Riesgo } from '../../core/models';
import { RiesgoService } from '../../core/riesgo.service';
import { NivelInsignia } from '../../shared/nivel-insignia';

interface Consulta {
  areaId: number | null;
  nivel: Nivel | null;
  impactoMinimo: number;
}

type Columna = 'peligro' | 'area' | 'probabilidad' | 'impacto' | 'nivel';

interface Orden {
  columna: Columna;
  ascendente: boolean;
}

// Quita tildes y mayúsculas para que la búsqueda no dependa de ellas.
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Tabla de riesgos: todos (/riesgos) o los de un área (/areas/:areaId/riesgos).
@Component({
  selector: 'app-riesgos-lista',
  imports: [RouterLink, NivelInsignia],
  templateUrl: './riesgos-lista.html',
  styleUrl: './riesgos-lista.scss',
})
export class RiesgosLista {
  private readonly riesgoService = inject(RiesgoService);
  private readonly areaService = inject(AreaService);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  // Parámetro de la ruta; ausente en la vista de todos los riesgos.
  readonly areaId = input<string>();
  // Parámetro opcional de la URL (?filtroNivel=ALTO), usado desde el panel de inicio.
  readonly filtroNivel = input<string>();

  protected readonly niveles = NIVELES;
  protected readonly etiquetaNivel = ETIQUETA_NIVEL;
  protected readonly impactos = [1, 2, 3, 4, 5];
  protected readonly columnas: { id: Columna; nombre: string; numero?: boolean }[] = [
    { id: 'peligro', nombre: 'Peligro' },
    { id: 'area', nombre: 'Área' },
    { id: 'probabilidad', nombre: 'Probabilidad', numero: true },
    { id: 'impacto', nombre: 'Impacto', numero: true },
    { id: 'nivel', nombre: 'Nivel' },
  ];

  protected readonly nivel = signal<Nivel | null>(null);
  protected readonly impactoMinimo = signal(1);
  protected readonly busqueda = signal('');
  protected readonly orden = signal<Orden | null>(null);

  protected readonly area = signal<Area | null>(null);
  private readonly riesgos = signal<Riesgo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<number | null>(null);
  protected readonly eliminando = signal(false);

  protected readonly filtrando = computed(
    () => this.nivel() !== null || this.impactoMinimo() > 1 || this.busqueda().trim() !== '',
  );
  protected readonly total = computed(() => this.riesgos().length);
  protected readonly columnasVisibles = computed(() =>
    this.columnas.filter((c) => c.id !== 'area' || !this.areaId()),
  );

  // Riesgos que se muestran: resultado de la API, filtrado por el texto buscado y ordenado.
  protected readonly visibles = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const orden = this.orden();
    let lista = this.riesgos();

    if (texto) {
      lista = lista.filter((r) => normalizar(`${r.peligro} ${r.descripcion} ${r.area.nombre}`).includes(texto));
    }
    if (orden) {
      const signo = orden.ascendente ? 1 : -1;
      lista = [...lista].sort((a, b) => signo * this.comparar(a, b, orden.columna));
    }
    return lista;
  });

  private readonly consulta = computed<Consulta>(() => {
    const areaId = this.areaId();
    return {
      areaId: areaId !== undefined ? Number(areaId) : null,
      nivel: this.nivel(),
      impactoMinimo: this.impactoMinimo(),
    };
  });

  constructor() {
    effect(() => {
      const inicial = this.filtroNivel()?.toUpperCase();
      if (inicial && (NIVELES as string[]).includes(inicial)) {
        this.nivel.set(inicial as Nivel);
      }
    });

    // Vuelve a consultar la API cada vez que cambia el área o un filtro.
    toObservable(this.consulta)
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap((consulta) =>
          this.pedir(consulta).pipe(
            catchError((e) => {
              this.error.set(mensajeDeError(e));
              return of<Riesgo[]>([]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((riesgos) => {
        this.riesgos.set(riesgos);
        this.cargando.set(false);
      });

    effect(() => {
      const areaId = this.areaId();
      this.area.set(null);
      if (areaId === undefined) return;
      this.areaService.obtener(Number(areaId)).subscribe({
        next: (area) => this.area.set(area),
        error: (e) => this.error.set(mensajeDeError(e)),
      });
    });
  }

  // Elige el endpoint según el contexto y completa los filtros restantes en el navegador.
  private pedir(consulta: Consulta): Observable<Riesgo[]> {
    const { areaId, nivel, impactoMinimo } = consulta;

    let peticion: Observable<Riesgo[]>;
    if (areaId !== null) {
      peticion = this.riesgoService.listarPorArea(areaId);
    } else if (nivel !== null) {
      peticion = this.riesgoService.listarPorNivel(nivel);
    } else if (impactoMinimo > 1) {
      peticion = this.riesgoService.listarPorImpactoMinimo(impactoMinimo);
    } else {
      peticion = this.riesgoService.listar();
    }

    return peticion.pipe(
      map((riesgos) => riesgos.filter((r) => (nivel === null || r.nivel === nivel) && r.impacto >= impactoMinimo)),
    );
  }

  private comparar(a: Riesgo, b: Riesgo, columna: Columna): number {
    switch (columna) {
      case 'peligro':
        return a.peligro.localeCompare(b.peligro, 'es');
      case 'area':
        return a.area.nombre.localeCompare(b.area.nombre, 'es');
      case 'nivel':
        return ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel] || a.probabilidad * a.impacto - b.probabilidad * b.impacto;
      default:
        return a[columna] - b[columna];
    }
  }

  // Primer clic: ascendente; segundo: descendente; tercero: orden original.
  protected ordenarPor(columna: Columna): void {
    const actual = this.orden();
    if (actual?.columna !== columna) {
      this.orden.set({ columna, ascendente: true });
    } else if (actual.ascendente) {
      this.orden.set({ columna, ascendente: false });
    } else {
      this.orden.set(null);
    }
  }

  protected ariaOrden(columna: Columna): 'ascending' | 'descending' | 'none' {
    const orden = this.orden();
    if (orden?.columna !== columna) return 'none';
    return orden.ascendente ? 'ascending' : 'descending';
  }

  protected flecha(columna: Columna): string {
    const orden = this.orden();
    if (orden?.columna !== columna) return '';
    return orden.ascendente ? '▲' : '▼';
  }

  // Selector de orden para pantallas angostas, donde no se ven los encabezados.
  protected ordenarDesdeSelector(valor: string): void {
    if (!valor) {
      this.orden.set(null);
      return;
    }
    const [columna, sentido] = valor.split(':');
    this.orden.set({ columna: columna as Columna, ascendente: sentido === 'asc' });
  }

  protected valorSelectorOrden(): string {
    const orden = this.orden();
    return orden ? `${orden.columna}:${orden.ascendente ? 'asc' : 'desc'}` : '';
  }

  protected cambiarNivel(valor: string): void {
    this.nivel.set(valor ? (valor as Nivel) : null);
  }

  protected cambiarImpacto(valor: string): void {
    this.impactoMinimo.set(Number(valor));
  }

  protected quitarFiltros(): void {
    this.nivel.set(null);
    this.impactoMinimo.set(1);
    this.busqueda.set('');
  }

  protected eliminar(riesgo: Riesgo): void {
    this.eliminando.set(true);
    this.error.set(null);
    this.riesgoService.eliminar(riesgo.id).subscribe({
      next: () => {
        this.riesgos.update((lista) => lista.filter((r) => r.id !== riesgo.id));
        this.avisos.exito(`Riesgo «${riesgo.peligro}» eliminado.`);
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
