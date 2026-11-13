import { Routes } from '@angular/router';
import { adminGuard, escrituraGuard, sesionGuard, sinSesionGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [sinSesionGuard],
    title: 'Iniciar sesión | SafeOps',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [sinSesionGuard],
    title: 'Crear cuenta | SafeOps',
    loadComponent: () => import('./features/auth/registro').then((m) => m.Registro),
  },
  {
    path: '',
    canActivate: [sesionGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio | SafeOps',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        title: 'Usuarios | SafeOps',
        loadComponent: () => import('./features/usuarios/usuarios-lista').then((m) => m.UsuariosLista),
      },
      {
        path: 'areas',
        title: 'Áreas | SafeOps',
        loadComponent: () => import('./features/areas/areas-lista').then((m) => m.AreasLista),
      },
      {
        path: 'areas/nueva',
        canActivate: [escrituraGuard],
        title: 'Registrar área | SafeOps',
        loadComponent: () => import('./features/areas/area-form').then((m) => m.AreaForm),
      },
      {
        path: 'areas/:id/editar',
        canActivate: [escrituraGuard],
        title: 'Editar área | SafeOps',
        loadComponent: () => import('./features/areas/area-form').then((m) => m.AreaForm),
      },
      {
        path: 'areas/:areaId/riesgos',
        title: 'Riesgos del área | SafeOps',
        loadComponent: () => import('./features/riesgos/riesgos-lista').then((m) => m.RiesgosLista),
      },
      {
        path: 'areas/:areaId/riesgos/nuevo',
        canActivate: [escrituraGuard],
        title: 'Registrar riesgo | SafeOps',
        loadComponent: () => import('./features/riesgos/riesgo-form').then((m) => m.RiesgoForm),
      },
      {
        path: 'riesgos',
        title: 'Riesgos | SafeOps',
        loadComponent: () => import('./features/riesgos/riesgos-lista').then((m) => m.RiesgosLista),
      },
      {
        path: 'riesgos/:id',
        title: 'Detalle del riesgo | SafeOps',
        loadComponent: () => import('./features/riesgos/riesgo-detalle').then((m) => m.RiesgoDetalle),
      },
      {
        path: 'riesgos/:id/editar',
        canActivate: [escrituraGuard],
        title: 'Editar riesgo | SafeOps',
        loadComponent: () => import('./features/riesgos/riesgo-form').then((m) => m.RiesgoForm),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
