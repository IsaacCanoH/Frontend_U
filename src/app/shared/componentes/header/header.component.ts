import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen: boolean = false;
  estaAutenticado = false;
  nombreUsuario = '';
  tipoUsuario: 'rentero' | 'estudiante' | null = null;
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Verificar el estado inicial
    this.verificarEstadoInicial();

    // Suscribirse al estado de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.estaAutenticado = isAuth;
        if (!isAuth) {
          this.nombreUsuario = '';
          this.tipoUsuario = null;
        }
      }
    );

    // También suscribirse a cambios en el usuario actual
    this.userSubscription = this.authService.usuarioActual$.subscribe(usuario => {
      if (usuario) {
        this.nombreUsuario = usuario.nombre;
        this.tipoUsuario = usuario.tipo;
        this.estaAutenticado = true;
      } else {
        this.nombreUsuario = '';
        this.tipoUsuario = null;
        this.estaAutenticado = false;
      }
    });
  }

  private verificarEstadoInicial(): void {
    // Verificar inmediatamente si hay un usuario autenticado
    this.estaAutenticado = this.authService.estaAutenticado();
    if (this.estaAutenticado) {
      const usuario = this.authService.obtenerUsuarioActual();
      this.nombreUsuario = usuario ? usuario.nombre : '';
      this.tipoUsuario = this.authService.obtenerTipoUsuario();
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Alterna el estado del menú móvil
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Cierra el menú móvil
   */
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  /**
   * Cerrar sesión del usuario
   */
  cerrarSesion(): void {
    this.authService.logout();
    this.closeMenu();
  }
}
