// src/app/core/services/servicios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private apiUrl = 'http://localhost:3000/servicios';

  constructor(private http: HttpClient) {}

  obtenerServiciosDisponibles(soloAdicionales = false): Observable<any> {
    const params = soloAdicionales ? new HttpParams().set('solo_adicionales', 'true') : undefined;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any>(`${this.apiUrl}/disponibles`, { params, headers });
  }
}
