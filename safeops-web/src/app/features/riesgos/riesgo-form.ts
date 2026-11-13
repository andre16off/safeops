import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AreaService } from '../../core/area.service';
import { AvisosService } from '../../core/avisos.service';
import { aplicarErroresDeApi, mensajeDeControl, mensajeDeError, sinSoloEspacios } from '../../core/errores';
import { Area, calcularNivel } from '../../core/models';
import { RiesgoService } from '../../core/riesgo.service';
import { CeldaMatriz, MatrizRiesgo } from '../../shared/matriz-riesgo';
import { NivelInsignia } from '../../shared/nivel-insignia';

type Campo = 'peligro' | 'descripcion' | 'probabilidad' | 'impacto';

// Formulario de registro (/areas/:areaId/riesgos/nuevo) y edición (/riesgos/:id/editar) de riesgos.
@Component({
  selector: 'app-riesgo-form',
  imports: [ReactiveFormsModule, RouterLink, MatrizRiesgo, NivelInsignia],
  templateUrl: './riesgo-form.html',
  styleUrl: './riesgo-form.scss',
})
export class RiesgoForm {
  private readonly riesgoService = inject(RiesgoService);
  private readonly areaService = inject(AreaService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly areaId = input<string>();
  readonly id = input<string>();
  protected readonly esEdicion = computed(() => this.id() !== undefined);

  protected readonly escala = [
    { valor: 1, probabilidad: '1 – Muy baja', impacto: '1 – Muy leve' },
    { valor: 2, probabilidad: '2 – Baja', impacto: '2 – Leve' },
    { valor: 3, probabilidad: '3 – Media', impacto: '3 – Moderado' },
    { valor: 4, probabilidad: '4 – Alta', impacto: '4 – Grave' },
    { valor: 5, probabilidad: '5 – Muy alta', impacto: '5 – Muy grave' },
  ];

  protected readonly area = signal<Area | null>(null);
  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    peligro: ['', [Validators.required, sinSoloEspacios, Validators.minLength(3), Validators.maxLength(120)]],
    descripcion: ['', [Validators.required, sinSoloEspacios, Validators.minLength(10), Validators.maxLength(255)]],
    probabilidad: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
    impacto: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });
  protected readonly probabilidad = computed(() => this.valores().probabilidad ?? null);
  protected readonly impacto = computed(() => this.valores().impacto ?? null);
  protected readonly caracteres = computed(() => (this.valores().descripcion ?? '').length);

  // Vista previa del nivel; el valor definitivo lo calcula la API al guardar.
  protected readonly resultado = computed(() => {
    const p = this.probabilidad();
    const i = this.impacto();
    return p && i ? { producto: p * i, nivel: calcularNivel(p, i) } : null;
  });

  protected readonly rutaCancelar = computed(() =>
    this.esEdicion() ? ['/riesgos', this.id()] : ['/areas', this.areaId(), 'riesgos'],
  );

  constructor() {
    effect(() => {
      const id = this.id();
      const areaId = this.areaId();
      if (id !== undefined) {
        this.cargarRiesgo(Number(id));
      } else if (areaId !== undefined) {
        this.cargarArea(Number(areaId));
      }
    });
  }

  protected errorDe(campo: Campo, nombre: string): string | null {
    return mensajeDeControl(this.formulario.controls[campo], nombre);
  }

  protected elegirCelda(celda: CeldaMatriz): void {
    this.formulario.patchValue(celda);
    this.formulario.controls.probabilidad.markAsDirty();
    this.formulario.controls.impacto.markAsDirty();
  }

  private cargarRiesgo(id: number): void {
    this.cargando.set(true);
    this.riesgoService.obtener(id).subscribe({
      next: (riesgo) => {
        this.area.set(riesgo.area);
        this.formulario.setValue({
          peligro: riesgo.peligro,
          descripcion: riesgo.descripcion,
          probabilidad: riesgo.probabilidad,
          impacto: riesgo.impacto,
        });
        this.cargando.set(false);
      },
      error: (e) => this.bloquear(e),
    });
  }

  private cargarArea(areaId: number): void {
    this.cargando.set(true);
    this.areaService.obtener(areaId).subscribe({
      next: (area) => {
        this.area.set(area);
        this.cargando.set(false);
      },
      error: (e) => this.bloquear(e),
    });
  }

  private bloquear(e: unknown): void {
    this.error.set(mensajeDeError(e));
    this.formulario.disable();
    this.cargando.set(false);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = {
      peligro: valores.peligro.trim(),
      descripcion: valores.descripcion.trim(),
      probabilidad: valores.probabilidad as number,
      impacto: valores.impacto as number,
    };
    const id = this.id();
    const peticion =
      id !== undefined
        ? this.riesgoService.actualizar(Number(id), datos)
        : this.riesgoService.registrar(Number(this.areaId()), datos);

    this.enviando.set(true);
    this.error.set(null);

    peticion.subscribe({
      next: (riesgo) => {
        this.avisos.exito(id !== undefined ? `Cambios guardados en «${riesgo.peligro}».` : `Riesgo «${riesgo.peligro}» registrado.`);
        this.router.navigate(['/riesgos', riesgo.id]);
      },
      error: (e) => {
        aplicarErroresDeApi(this.formulario, e);
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }
}
