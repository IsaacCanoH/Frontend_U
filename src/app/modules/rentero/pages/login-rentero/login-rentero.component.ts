import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RenteroService } from '../../../../core/services/rentero.service';

@Component({
  selector: 'app-login-rentero',
  templateUrl: './login-rentero.component.html',
  styleUrls: ['./login-rentero.component.scss']
})
export class LoginRenteroComponent implements OnInit {
  loginForm: FormGroup;
  cargando = false;
  error = '';
  mostrarPassword = false;

  constructor(
    private fb: FormBuilder,
    private renteroService: RenteroService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.renteroService.estaAutenticado()) {
      this.router.navigate(['/rentero']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.cargando = true;
      this.error = '';

      const credenciales = this.loginForm.value;

      this.renteroService.login(credenciales).subscribe({
        next: (response) => {
          this.cargando = false;
          if (response.exito) {
            // Redirigir al dashboard del rentero
            this.router.navigate(['/rentero']);
          } else {
            this.error = response.mensaje || 'Error en el inicio de sesión';
          }
        },
        error: (error) => {
          this.cargando = false;
          this.error = error.error?.mensaje || 'Error en el servidor. Intenta nuevamente.';
        }
      });
    } else {
      this.marcarCamposComoTocados();
    }
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  irARegistro(): void {
    this.router.navigate(['/rentero/registro']);
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // Métodos de utilidad para el template
  get emailInvalido(): boolean {
    const email = this.loginForm.get('email');
    return !!(email?.invalid && email?.touched);
  }

  get passwordInvalido(): boolean {
    const password = this.loginForm.get('password');
    return !!(password?.invalid && password?.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.loginForm.get(campo);
    if (!control?.errors || !control?.touched) return '';

    if (control.errors['required']) return `${campo === 'email' ? 'Email' : 'Contraseña'} es requerido`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';

    return 'Campo inválido';
  }

  irAHome(): void {
  this.router.navigate(['/']);
  }
}
