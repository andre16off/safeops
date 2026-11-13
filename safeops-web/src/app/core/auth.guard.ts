import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Solo deja pasar a usuarios con sesión activa.
export const sesionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token() ? true : inject(Router).createUrlTree(['/login']);
};

// Login y registro: si ya hay sesión, lleva a la vista inicial del rol.
export const sinSesionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token() ? inject(Router).createUrlTree([auth.rutaInicial()]) : true;
};

// Administración de usuarios: solo ADMIN.
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.esAdmin() ? true : inject(Router).createUrlTree([auth.rutaInicial()]);
};

// Formularios de registro y edición: solo ADMIN y USER.
export const escrituraGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.puedeEscribir() ? true : inject(Router).createUrlTree([auth.rutaInicial()]);
};
