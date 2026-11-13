export type Rol = 'ADMIN' | 'USER' | 'GUEST';
export type Nivel = 'BAJO' | 'MEDIO' | 'ALTO';

export interface Area {
  id: number;
  nombre: string;
  ubicacion: string;
}

export type AreaDatos = Omit<Area, 'id'>;

export interface Riesgo {
  id: number;
  peligro: string;
  descripcion: string;
  probabilidad: number;
  impacto: number;
  nivel: Nivel;
  area: Area;
}

export type RiesgoDatos = Pick<Riesgo, 'peligro' | 'descripcion' | 'probabilidad' | 'impacto'>;

export interface Usuario {
  id: number;
  nombreUsuario: string;
  rol: Rol;
}

export interface Sesion {
  token: string;
  nombreUsuario: string;
  rol: Rol;
}

export const NIVELES: Nivel[] = ['BAJO', 'MEDIO', 'ALTO'];

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
};

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuario',
  GUEST: 'Invitado',
};

// Orden de menor a mayor gravedad, para ordenar tablas.
export const ORDEN_NIVEL: Record<Nivel, number> = { BAJO: 1, MEDIO: 2, ALTO: 3 };

// Misma regla que aplica la API: probabilidad × impacto.
export function calcularNivel(probabilidad: number, impacto: number): Nivel {
  const resultado = probabilidad * impacto;
  if (resultado <= 5) return 'BAJO';
  if (resultado <= 12) return 'MEDIO';
  return 'ALTO';
}
