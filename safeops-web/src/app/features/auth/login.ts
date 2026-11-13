import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeControl, mensajeDeError } from '../../core/errores';
import { MatrizRiesgo } from '../../shared/matriz-riesgo';
import { TemaBoton } from '../../shared/tema-boton';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatrizRiesgo, TemaBoton],
  templateUrl: './login.html',
  styleUrl: './acceso.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  // Parámetros de la URL: ?sesion=vencida y ?registrado=usuario
  readonly sesion = input<string>();
  readonly registrado = input<string>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected errorDe(campo: 'nombreUsuario' | 'password', nombre: string): string | null {
    return mensajeDeControl(this.formulario.controls[campo], nombre);
  }

  protected ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombreUsuario, password } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.error.set(null);

    this.auth.iniciarSesion(nombreUsuario.trim(), password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.rutaInicial()),
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }
}
