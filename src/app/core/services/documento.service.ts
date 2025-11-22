import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoDocumento } from '../../interfaces/documento.interface';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private apiUrl = 'http://localhost:3000/documentos';

  constructor(private http: HttpClient) { }

  obtenerTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/`)
      .pipe(
        map((tipos: TipoDocumento[]) => tipos.filter(tipo => tipo.id !== 1))
      );
  }
}