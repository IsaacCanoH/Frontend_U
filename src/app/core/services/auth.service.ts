import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipo: 'rentero' | 'estudiante';
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private usuarioKey = 'auth_usuario';
  private tipoUsuarioKey = 'auth_tipo';

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

  // ===== FUNCIONES DE AUTENTICACIÓN UNIFICADA =====

  /**
   * Intenta iniciar sesión como rentero o estudiante
   */
  login(credenciales: LoginRequest): Observable<any> {
    // Intentar primero como rentero
    return this.http.post<any>('http://localhost:3000/rentero/login', credenciales).pipe(
      tap((response) => {
        if (response.exito) {
          this.guardarSesion(response.datos.rentero, response.datos.token, 'rentero');
        }
      }),
      catchError(() => {
        // Si falla como rentero, intentar como estudiante
        return this.http.post<any>('http://localhost:3000/estudiante/login', credenciales).pipe(
          tap((response) => {
            if (response.exito) {
              this.guardarSesion(response.datos.estudiante, response.datos.token, 'estudiante');
            }
          })
        );
      })
    );
  }

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): void {
    const tipoUsuario = this.obtenerTipoUsuario();
    const apiUrl = tipoUsuario === 'rentero'
      ? 'http://localhost:3000/rentero/logout'
      : 'http://localhost:3000/estudiante/logout';

    // Llamar al endpoint de logout (opcional, ya que JWT es stateless)
    this.http.post(apiUrl, {}).subscribe();

    // Limpiar datos locales
    this.eliminarSesion();
    this.isAuthenticatedSubject.next(false);
    this.usuarioActualSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Valida el token actual
   */
  validarToken(): Observable<any> {
    const tipoUsuario = this.obtenerTipoUsuario();
    const apiUrl = tipoUsuario === 'rentero'
      ? 'http://localhost:3000/rentero/validar'
      : 'http://localhost:3000/estudiante/validar';

    return this.http.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${this.obtenerToken()}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // ===== FUNCIONES DE UTILIDAD =====

  /**
   * Verifica si el usuario está autenticado
   */
  estaAutenticado(): boolean {
    return this.tieneToken();
  }

  /**
   * Obtiene el token actual
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtiene el usuario actual
   */
  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  /**
   * Obtiene el tipo de usuario actual
   */
  obtenerTipoUsuario(): 'rentero' | 'estudiante' | null {
    return localStorage.getItem(this.tipoUsuarioKey) as 'rentero' | 'estudiante' | null;
  }

  /**
   * Verifica si el usuario es rentero
   */
  esRentero(): boolean {
    return this.obtenerTipoUsuario() === 'rentero';
  }

  /**
   * Verifica si el usuario es estudiante
   */
  esEstudiante(): boolean {
    return this.obtenerTipoUsuario() === 'estudiante';
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Verifica si existe un token válido
   */
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

  /**
   * Guarda la sesión del usuario
   */
  private guardarSesion(usuario: any, token: string, tipo: 'rentero' | 'estudiante'): void {
    const usuarioConTipo: Usuario = { ...usuario, tipo };

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuarioConTipo));
    localStorage.setItem(this.tipoUsuarioKey, tipo);

    this.isAuthenticatedSubject.next(true);
    this.usuarioActualSubject.next(usuarioConTipo);
  }

  /**
   * Elimina la sesión actual
   */
  private eliminarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    localStorage.removeItem(this.tipoUsuarioKey);
  }

  /**
   * Obtiene el usuario almacenado en localStorage
   */
  private obtenerUsuarioAlmacenado(): Usuario | null {
    const usuario = localStorage.getItem(this.usuarioKey);
    return usuario ? JSON.parse(usuario) : null;
  }
}
