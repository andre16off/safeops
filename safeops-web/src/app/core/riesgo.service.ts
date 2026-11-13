import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Nivel, Riesgo, RiesgoDatos } from './models';

@Injectable({ providedIn: 'root' })
export class RiesgoService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(): Observable<Riesgo[]> {
    return this.http.get<Riesgo[]>(`${this.url}/riesgos`);
  }

  listarPorArea(areaId: number): Observable<Riesgo[]> {
    return this.http.get<Riesgo[]>(`${this.url}/areas/${areaId}/riesgos`);
  }

  // Consulta JPQL de la API: riesgos de un nivel.
  listarPorNivel(nivel: Nivel): Observable<Riesgo[]> {
    return this.http.get<Riesgo[]>(`${this.url}/riesgos/nivel/${nivel}`);
  }

  // Consulta JPQL de la API: riesgos con impacto igual o superior al indicado.
  listarPorImpactoMinimo(impacto: number): Observable<Riesgo[]> {
    return this.http.get<Riesgo[]>(`${this.url}/riesgos/impacto-minimo/${impacto}`);
  }

  obtener(id: number): Observable<Riesgo> {
    return this.http.get<Riesgo>(`${this.url}/riesgos/${id}`);
  }

  registrar(areaId: number, datos: RiesgoDatos): Observable<Riesgo> {
    return this.http.post<Riesgo>(`${this.url}/areas/${areaId}/riesgos`, datos);
  }

  actualizar(id: number, datos: RiesgoDatos): Observable<Riesgo> {
    return this.http.put<Riesgo>(`${this.url}/riesgos/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/riesgos/${id}`);
  }
}
