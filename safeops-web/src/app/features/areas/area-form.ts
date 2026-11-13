import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AreaService } from '../../core/area.service';
import { AvisosService } from '../../core/avisos.service';
import { aplicarErroresDeApi, mensajeDeControl, mensajeDeError, sinSoloEspacios } from '../../core/errores';

// Formulario de registro y edición de áreas.
@Component({
  selector: 'app-area-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './area-form.html',
})
export class AreaForm {
  private readonly areaService = inject(AreaService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(NonNullableFormBuilder);

  // Parámetro de la ruta /areas/:id/editar (ausente al registrar).
  readonly id = input<string>();
  protected readonly esEdicion = computed(() => this.id() !== undefined);

  protected readonly cargando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, sinSoloEspacios, Validators.minLength(3), Validators.maxLength(100)]],
    ubicacion: ['', [Validators.required, sinSoloEspacios, Validators.maxLength(150)]],
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id !== undefined) this.cargar(Number(id));
    });
  }

  protected errorDe(campo: 'nombre' | 'ubicacion', nombre: string): string | null {
    return mensajeDeControl(this.formulario.controls[campo], nombre);
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.areaService.obtener(id).subscribe({
      next: (area) => {
        this.formulario.setValue({ nombre: area.nombre, ubicacion: area.ubicacion });
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.formulario.disable();
        this.cargando.set(false);
      },
    });
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = { nombre: valores.nombre.trim(), ubicacion: valores.ubicacion.trim() };
    const id = this.id();
    const peticion =
      id !== undefined ? this.areaService.actualizar(Number(id), datos) : this.areaService.registrar(datos);

    this.enviando.set(true);
    this.error.set(null);

    peticion.subscribe({
      next: (area) => {
        this.avisos.exito(id !== undefined ? `Cambios guardados en «${area.nombre}».` : `Área «${area.nombre}» registrada.`);
        this.router.navigate(['/areas']);
      },
      error: (e) => {
        aplicarErroresDeApi(this.formulario, e);
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }
}
