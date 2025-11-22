import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertasService {
  constructor(private toastr: ToastrService) {}

  /**
   * Muestra un mensaje de éxito usando Toastr
   */
  mostrarExito(mensaje: string, titulo: string = 'Éxito'): void {
    this.toastr.success(mensaje, titulo, {
      timeOut: 3000,
      progressBar: true
    });
  }

  /**
   * Muestra un mensaje de error usando Toastr
   */
  mostrarError(mensaje: string, titulo: string = 'Error'): void {
    this.toastr.error(mensaje, titulo, {
      timeOut: 5000,
      progressBar: true
    });
  }

  /**
   * Muestra una alerta de advertencia usando Toastr
   */
  mostrarAdvertencia(mensaje: string, titulo: string = 'Advertencia'): void {
    this.toastr.warning(mensaje, titulo, {
      timeOut: 4000,
      progressBar: true
    });
  }

  /**
   * Muestra información usando Toastr
   */
  mostrarInfo(mensaje: string, titulo: string = 'Información'): void {
    this.toastr.info(mensaje, titulo, {
      timeOut: 3000,
      progressBar: true
    });
  }

  /**
   * Maneja errores del backend y los muestra apropiadamente
   */
  manejarErrores(error: any, contexto: string = 'operación'): void {
    let mensaje = 'Ha ocurrido un error inesperado';

    // Extraer mensaje del error
    if (error?.error?.mensaje) {
      mensaje = error.error.mensaje;
    } else if (error?.error?.message) {
      mensaje = error.error.message;
    } else if (error?.mensaje) {
      mensaje = error.mensaje;
    } else if (error?.message) {
      mensaje = error.message;
    }

    // Errores específicos por código de estado
    if (error?.status) {
      switch (error.status) {
        case 400:
          mensaje = 'Datos inválidos. Verifica la información ingresada.';
          break;
        case 401:
          mensaje = 'No estás autenticado. Inicia sesión nuevamente.';
          break;
        case 403:
          mensaje = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          mensaje = 'El recurso solicitado no existe.';
          break;
        case 413:
          mensaje = 'Los archivos son demasiado grandes.';
          break;
        case 500:
          mensaje = 'Error interno del servidor. Intenta más tarde.';
          break;
        case 0:
          mensaje = 'No se puede conectar con el servidor.';
          break;
      }
    }

    this.mostrarError(mensaje, `Error en ${contexto}`);
  }

  /**
   * Muestra confirmación usando SweetAlert2
   */
  async confirmarAccion(
    titulo: string,
    mensaje: string,
    textoConfirmar: string = 'Sí, continuar',
    textoCancelar: string = 'Cancelar'
  ): Promise<boolean> {
    const resultado = await Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: textoConfirmar,
      cancelButtonText: textoCancelar,
      reverseButtons: true
    });

    return resultado.isConfirmed;
  }

  /**
   * Muestra confirmación de eliminación usando SweetAlert2
   */
  async confirmarEliminacion(elemento: string = 'este elemento'): Promise<boolean> {
    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará ${elemento} permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    return resultado.isConfirmed;
  }

  /**
   * Muestra alerta de información usando SweetAlert2
   */
  mostrarAlerta(titulo: string, mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: tipo,
      confirmButtonText: 'Entendido'
    });
  }
}
