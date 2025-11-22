import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RenteroService } from '../../../core/services/rentero.service'; // Ajusta la ruta según tu estructura

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen: boolean = false;
  estaAutenticado = false;
  nombreUsuario = '';
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(private renteroService: RenteroService) {}

  ngOnInit(): void {
    // Verificar el estado inicial
    this.verificarEstadoInicial();

    // Suscribirse al estado de autenticación
    this.authSubscription = this.renteroService.isAuthenticated$.subscribe(
      isAuth => {
        this.estaAutenticado = isAuth;
        if (!isAuth) {
          this.nombreUsuario = '';
        }
      }
    );

    // También suscribirse a cambios en el usuario actual
    this.userSubscription = this.renteroService.usuarioActual$.subscribe(usuario => {
      if (usuario) {
        this.nombreUsuario = usuario.nombre;
        this.estaAutenticado = true;
      } else {
        this.nombreUsuario = '';
        this.estaAutenticado = false;
      }
    });
  }

  private verificarEstadoInicial(): void {
    // Verificar inmediatamente si hay un usuario autenticado
    this.estaAutenticado = this.renteroService.estaAutenticado();
    if (this.estaAutenticado) {
      const usuario = this.renteroService.obtenerUsuarioActual();
      this.nombreUsuario = usuario ? usuario.nombre : '';
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
    this.renteroService.logout();
    this.closeMenu();
  }
}
