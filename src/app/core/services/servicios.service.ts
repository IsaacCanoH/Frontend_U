import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private api = 'http://localhost:3000/servicios';

  constructor(private http: HttpClient) {}

  // Obtener todos los servicios (base + extras). Si quieres solo extras: usar soloAdicionales=true
  obtenerServicios(soloAdicionales = false): Observable<any> {
    const params = soloAdicionales ? new HttpParams().set('solo_adicionales', 'true') : undefined;
    return this.http.get<any>(`${this.api}/disponibles`, { params });
  }
}
