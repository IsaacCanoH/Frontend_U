import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders  } from '@angular/common/http';


import { Observable } from 'rxjs';
import { FormularioRegistroEstudiante, RespuestaRegistroEstudiante } from '../../interfaces/estudiante.interface';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private apiUrl = 'http://localhost:3000/estudiante';

  constructor(private http: HttpClient) {}


  obtenerMisUnidades(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/unidades`, this.getAuthHeaders());
}

obtenerUnidadAsignada(unidadId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/unidades/${unidadId}`, this.getAuthHeaders());
}


  // helper para auth headers (usar la función que ya tengas o repetir)
  private getAuthHeaders(): { headers: HttpHeaders } {
  const token = localStorage.getItem('auth_token') || '';
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  return { headers };
}

  /**
   * Registrar un nuevo estudiante
   */
  registrarEstudiante(datosEstudiante: FormularioRegistroEstudiante): Observable<RespuestaRegistroEstudiante> {
    return this.http.post<RespuestaRegistroEstudiante>(`${this.apiUrl}/registrar`, datosEstudiante);
  }
}
