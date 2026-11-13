import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Area, AreaDatos } from './models';

@Injectable({ providedIn: 'root' })
export class AreaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/areas`;

  listar(): Observable<Area[]> {
    return this.http.get<Area[]>(this.url);
  }

  obtener(id: number): Observable<Area> {
    return this.http.get<Area>(`${this.url}/${id}`);
  }

  registrar(datos: AreaDatos): Observable<Area> {
    return this.http.post<Area>(this.url, datos);
  }

  actualizar(id: number, datos: AreaDatos): Observable<Area> {
    return this.http.put<Area>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
