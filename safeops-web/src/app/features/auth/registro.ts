import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeControl, mensajeDeError } from '../../core/errores';
import { TemaBoton } from '../../shared/tema-boton';

// La confirmación debe ser igual a la contraseña.
function confirmacionIgual(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  return control.value && control.value !== password ? { noCoincide: true } : null;
}

type Campo = 'nombreUsuario' | 'password' | 'confirmacion';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, TemaBoton],
  templateUrl: './registro.html',
  styleUrl: './acceso.scss',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombreUsuario: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(/^[A-Za-z0-9._-]+$/),
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmacion: ['', [Validators.required, confirmacionIgual]],
  });

  constructor() {
    // Si cambia la contraseña, se vuelve a comparar la confirmación.
    this.formulario.controls.password.valueChanges.subscribe(() =>
      this.formulario.controls.confirmacion.updateValueAndValidity(),
    );
  }

  protected errorDe(campo: Campo, nombre: string): string | null {
    return mensajeDeControl(this.formulario.controls[campo], nombre);
  }

  protected crearCuenta(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombreUsuario, password } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);

    this.auth.registrar(nombreUsuario, password).subscribe({
      next: (respuesta) =>
        this.router.navigate(['/login'], { queryParams: { registrado: respuesta.nombreUsuario } }),
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }
}
