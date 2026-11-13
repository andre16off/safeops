import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Agrega el token JWT a las peticiones a la API y cierra la sesión si la API responde 401.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const esApi = req.url.startsWith(environment.apiUrl);
  const esAutenticacion = req.url.startsWith(`${environment.apiUrl}/auth/`);
  // untracked: si la petición nace dentro de un effect, leer la sesión aquí no debe
  // hacer que ese effect se repita (y vuelva a pedir datos) cuando se cierra la sesión.
  const token = esApi && !esAutenticacion ? untracked(() => auth.token()) : null;

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && esApi && !esAutenticacion) {
        auth.cerrarSesion();
        router.navigate(['/login'], { queryParams: { sesion: 'vencida' } });
      }
      return throwError(() => error);
    }),
  );
};
