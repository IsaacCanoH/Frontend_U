import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UniversidadApiResponse } from '../../interfaces/universidad.interface'; 

@Injectable({
  providedIn: 'root'
})
export class UniversidadService {
  private apiUrl = 'http://localhost:3000/universidades';

  constructor(private http: HttpClient) {}

  obtenerUniversidades(): Observable<UniversidadApiResponse> {
    return this.http.get<UniversidadApiResponse>(this.apiUrl);
  }
}
