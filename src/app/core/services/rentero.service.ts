import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { FormularioRegistroRentero, RespuestaRegistroRentero, LoginRequest, LoginResponse } from '../../interfaces/rentero.interface';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

@Injectable({
  providedIn: 'root'
})
export class RenteroService {
  private apiUrl = 'http://localhost:3000/rentero';
  private tokenKey = 'rentero_token';
  private usuarioKey = 'rentero_usuario';

  // BehaviorSubjects para manejar el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.tieneToken());
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioAlmacenado());

  // Observables públicos
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ===== FUNCIONES DE REGISTRO =====
  registrarRentero(datosRentero: FormularioRegistroRentero, archivo: File): Observable<RespuestaRegistroRentero> {
    const formData = new FormData();

    Object.keys(datosRentero).forEach(key => {
      formData.append(key, datosRentero[key as keyof FormularioRegistroRentero]);
    });

    formData.append('documento', archivo, archivo.name);
    formData.append('tipo_id', '1');

    return this.http.post<RespuestaRegistroRentero>(`${this.apiUrl}/registrar`, formData);
  }

  // ===== FUNCIONES DE AUTENTICACIÓN =====
  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((response: LoginResponse) => {
        if (response.exito) {
          this.guardarToken(response.datos.token);
          this.guardarUsuario(response.datos.rentero);
          this.isAuthenticatedSubject.next(true);
          this.usuarioActualSubject.next(response.datos.rentero);
        }
      })
    );
  }

  logout(): void {
    // Llamar al endpoint de logout (opcional, ya que JWT es stateless)
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();

    // Limpiar datos locales
    this.eliminarToken();
    this.eliminarUsuario();
    this.isAuthenticatedSubject.next(false);
    this.usuarioActualSubject.next(null);
    this.router.navigate(['/rentero/login']);
  }

  validarToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/validar`, {
      headers: this.obtenerHeadersAutorizacion()
    });
  }

  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/perfil`, {
      headers: this.obtenerHeadersAutorizacion()
    });
  }

  // ===== FUNCIONES DE UTILIDAD DE AUTENTICACIÓN =====

  // Obtener token
  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Verificar si está autenticado
  estaAutenticado(): boolean {
    return this.tieneToken();
  }

  // Obtener usuario actual
  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  // Obtener headers con autorización
  obtenerHeadersAutorizacion(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // ===== MÉTODOS PRIVADOS =====

  private tieneToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    // Verificar si el token no ha expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const ahora = Math.floor(Date.now() / 1000);
      return payload.exp > ahora;
    } catch {
      return false;
    }
  }

  private guardarToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private eliminarToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private guardarUsuario(usuario: Usuario): void {
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
  }

  private eliminarUsuario(): void {
    localStorage.removeItem(this.usuarioKey);
  }

  private obtenerUsuarioAlmacenado(): Usuario | null {
    const usuario = localStorage.getItem(this.usuarioKey);
    return usuario ? JSON.parse(usuario) : null;
  }
}
