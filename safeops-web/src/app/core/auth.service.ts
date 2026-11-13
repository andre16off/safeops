import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol, Sesion } from './models';

const CLAVE_SESION = 'safeops.sesion';

interface RespuestaRegistro {
  id: number;
  nombreUsuario: string;
  rol: Rol;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly sesion = signal<Sesion | null>(this.leerSesion());

  readonly usuario = computed(() => this.sesion()?.nombreUsuario ?? null);
  readonly rol = computed(() => this.sesion()?.rol ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  // Permisos que la API aplica por rol; aquí solo deciden qué se muestra.
  readonly puedeEscribir = computed(() => this.rol() === 'ADMIN' || this.rol() === 'USER');
  readonly puedeEliminar = computed(() => this.rol() === 'ADMIN');
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');

  token(): string | null {
    const sesion = this.sesion();
    if (!sesion) return null;
    if (this.tokenVencido(sesion.token)) {
      this.cerrarSesion();
      return null;
    }
    return sesion.token;
  }

  iniciarSesion(nombreUsuario: string, password: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.url}/login`, { nombreUsuario, password })
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  registrar(nombreUsuario: string, password: string): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.url}/register`, { nombreUsuario, password });
  }

  cerrarSesion(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Sin acceso a localStorage: la sesión ya se quitó de memoria.
    }
  }

  // Vista inicial según el rol: ADMIN y USER ven el panel; el invitado va a la consulta.
  rutaInicial(): string {
    return this.rol() === 'GUEST' ? '/riesgos' : '/inicio';
  }

  private guardarSesion(respuesta: Sesion): void {
    const sesion: Sesion = {
      token: respuesta.token,
      nombreUsuario: respuesta.nombreUsuario,
      rol: respuesta.rol,
    };
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Sin acceso a localStorage: la sesión dura hasta recargar la página.
    }
  }

  private leerSesion(): Sesion | null {
    try {
      const guardada = localStorage.getItem(CLAVE_SESION);
      if (!guardada) return null;
      const sesion = JSON.parse(guardada) as Sesion;
      if (!sesion.token || this.tokenVencido(sesion.token)) {
        localStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      return null;
    }
  }

  // Lee la fecha de expiración (exp) del JWT sin validar la firma;
  // la validación real la hace la API en cada petición.
  private tokenVencido(token: string): boolean {
    try {
      const carga = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(carga)) as { exp?: number };
      return typeof exp === 'number' && exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
