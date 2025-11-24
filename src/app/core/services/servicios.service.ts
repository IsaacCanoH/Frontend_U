import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private apiUrl = 'http://localhost:3000/servicios';

  constructor(private http: HttpClient) { }

  obtenerServiciosDisponibles(soloAdicionales = false): Observable<any> {
    const params = soloAdicionales ? new HttpParams().set('solo_adicionales', 'true') : undefined;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`
    });
    return this.http.get<any>(`${this.apiUrl}/disponibles`, { params, headers });
  }

  obtenerServiciosPorAsignacion(estudianteUnidadId: number): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` });
    return this.http.get<any>(`${this.apiUrl}/asignacion/${estudianteUnidadId}`, { headers });
  }

  agregarServicioAAsignacion(estudianteUnidadId: number, servicioId: number): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`, 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiUrl}/asignacion/${estudianteUnidadId}/agregar`, { servicio_id: servicioId }, { headers });
  }

  eliminarServicioDeAsignacion(estudianteUnidadId: number, servicioId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`
    });
    return this.http.delete<any>(
      `${this.apiUrl}/asignacion/${estudianteUnidadId}/servicio/${servicioId}`,
      { headers }
    );
  }

  enviarPrefacturaAsignacion(estudianteUnidadId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(
      `${this.apiUrl}/asignacion/${estudianteUnidadId}/enviar-prefactura`,
      {},
      { headers }
    );
  }

}
