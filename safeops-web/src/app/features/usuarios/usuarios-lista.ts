import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { mensajeDeError } from '../../core/errores';
import { ETIQUETA_ROL, Usuario } from '../../core/models';
import { UsuarioService } from '../../core/usuario.service';

// Lista de cuentas registradas. Solo la ve el administrador.
@Component({
  selector: 'app-usuarios-lista',
  templateUrl: './usuarios-lista.html',
})
export class UsuariosLista {
  private readonly usuarioService = inject(UsuarioService);
  private readonly avisos = inject(AvisosService);
  protected readonly auth = inject(AuthService);

  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly porEliminar = signal<number | null>(null);
  protected readonly eliminando = signal(false);

  constructor() {
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected eliminar(usuario: Usuario): void {
    this.eliminando.set(true);
    this.error.set(null);
    this.usuarioService.eliminar(usuario.id).subscribe({
      next: () => {
        this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
        this.avisos.exito(`Usuario «${usuario.nombreUsuario}» eliminado.`);
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
