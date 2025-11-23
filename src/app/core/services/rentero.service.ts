import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormularioRegistroRentero, RespuestaRegistroRentero } from '../../interfaces/rentero.interface';

@Injectable({
  providedIn: 'root'
})
export class RenteroService {
  private apiUrl = 'http://localhost:3000/rentero';

  constructor(private http: HttpClient) {}

  /**
   * Registrar un nuevo rentero
   */
  registrarRentero(datosRentero: FormularioRegistroRentero, archivo: File): Observable<RespuestaRegistroRentero> {
    const formData = new FormData();

    Object.keys(datosRentero).forEach(key => {
      formData.append(key, datosRentero[key as keyof FormularioRegistroRentero]);
    });

    formData.append('documento', archivo, archivo.name);
    formData.append('tipo_id', '1');

    return this.http.post<RespuestaRegistroRentero>(`${this.apiUrl}/registrar`, formData);
  }
}
