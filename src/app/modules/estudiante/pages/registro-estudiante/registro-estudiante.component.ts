import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EstudianteService } from '../../../../core/services/estudiante.service';
import { DocumentoValidacionService } from '../../../../core/services/documento-validacion.service';
import { FormularioRegistroEstudiante, RespuestaRegistroEstudiante } from '../../../../interfaces/estudiante.interface';

@Component({
  selector: 'app-registro-estudiante',
  templateUrl: './registro-estudiante.component.html',
  styleUrls: ['./registro-estudiante.component.scss']
})
export class RegistroEstudianteComponent {
  formulario: FormGroup;
  procesando: boolean = false;
  mostrarPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private estudianteService: EstudianteService,
    private documentoValidacionService: DocumentoValidacionService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get datosValidos(): boolean {
    return this.formulario.valid;
  }

  registrar(): void {
    if (!this.formulario.valid) {
      this.documentoValidacionService.manejarErrores({ mensaje: 'Por favor completa todos los campos' }, 'Formulario incompleto');
      return;
    }

    this.procesando = true;
    const datosEstudiante: FormularioRegistroEstudiante = {
      nombre: this.formulario.value.nombre,
      apellido: this.formulario.value.apellido,
      telefono: this.formulario.value.telefono,
      email: this.formulario.value.email,
      password: this.formulario.value.password
    };

    this.estudianteService.registrarEstudiante(datosEstudiante).subscribe({
      next: (respuesta: any) => {
        this.procesando = false;
        if (respuesta) {
          this.documentoValidacionService.mostrarExito('Registro exitoso. Ya puedes iniciar sesión.', '¡Bienvenido!');
          this.reiniciarFormulario();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          const mensaje = respuesta.errores?.join(', ') || respuesta.mensaje || 'Error en el registro';
          this.documentoValidacionService.mostrarExito(mensaje, 'Error en el registro');
        }
      },
      error: (error) => {
        this.procesando = false;
        this.documentoValidacionService.manejarErrores(error, 'registro de estudiante');
      }
    });
  }

  reiniciarFormulario(): void {
    this.formulario.reset();
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control?.errors || !control?.touched) return '';

    if (control.errors['required']) return `${campo} es requerido`;
    if (control.errors['minlength']) return `${campo} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['pattern']) return 'Formato inválido';

    return 'Campo inválido';
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}
