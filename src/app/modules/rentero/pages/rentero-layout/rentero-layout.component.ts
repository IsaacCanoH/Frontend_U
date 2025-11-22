import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import { AlertasService } from '../../../../core/services/alertas.service'; // AGREGADO
import { Unidad } from '../../../../interfaces/propiedad.interface';
import Swal from 'sweetalert2';

// Define la interfaz temporal que coincide con los datos reales
interface PropiedadBackend {
  id: number;
  nombre: string;
  calle: string;
  colonia: string;
  numero: string;
  municipio: string;
  visible?: boolean;
}

@Component({
  selector: 'app-rentero-layout',
  templateUrl: './rentero-layout.component.html',
  styleUrl: './rentero-layout.component.scss'
})
export class RenteroLayoutComponent implements OnInit {
  propiedades: PropiedadBackend[] = [];
  cargando = false;
  error = '';
  unidadesPorPropiedad: { [key: number]: number } = {};

  // Nuevas propiedades para manejo de unidades
  propiedadExpandida: number | null = null;
  unidadesActuales: Unidad[] = [];
  cargandoUnidades = false;

  constructor(
    private router: Router,
    private propiedadService: PropiedadService,
    private alertasService: AlertasService // AGREGADO
  ) {}

  ngOnInit(): void {
    this.cargarPropiedades();
  }

  cargarPropiedades(): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedadesDelRentero().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.propiedades = response.data as PropiedadBackend[];
          this.cargarContadoresUnidades();
        } else {
          this.error = 'No se pudieron cargar las propiedades';
        }
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las propiedades. Intenta de nuevo.';
        this.cargando = false;
        this.alertasService.manejarErrores(error, 'carga de propiedades');
      }
    });
  }

  private cargarContadoresUnidades(): void {
    this.propiedades.forEach(propiedad => {
      this.propiedadService.obtenerUnidadesPorPropiedad(propiedad.id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.unidadesPorPropiedad[propiedad.id] = response.data.length;
          } else {
            this.unidadesPorPropiedad[propiedad.id] = 0;
          }
        },
        error: (error) => {
          this.unidadesPorPropiedad[propiedad.id] = 0;
          // No mostrar error aquí para evitar spam de alertas
        }
      });
    });
  }

  // Nuevos métodos para manejo de unidades
  toggleUnidades(propiedadId: number): void {
    if (this.propiedadExpandida === propiedadId) {
      // Si ya está expandida, la cerramos
      this.propiedadExpandida = null;
      this.unidadesActuales = [];
    } else {
      // Expandir y cargar unidades
      this.propiedadExpandida = propiedadId;
      this.cargarUnidadesDetalle(propiedadId);
    }
  }

  private cargarUnidadesDetalle(propiedadId: number): void {
    this.cargandoUnidades = true;
    this.unidadesActuales = [];

    this.propiedadService.obtenerUnidadesPorPropiedad(propiedadId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unidadesActuales = response.data;
        }
        this.cargandoUnidades = false;
      },
      error: (error) => {
        this.cargandoUnidades = false;
        this.alertasService.manejarErrores(error, 'carga de unidades');
      }
    });
  }

  editarUnidad(unidadId: number): void {
    this.router.navigate(['/rentero/unidades', unidadId, 'editar']);
  }

  async eliminarUnidad(unidadId: number): Promise<void> {
    if (!unidadId || isNaN(unidadId)) {
      this.alertasService.mostrarError('ID de unidad inválido', 'Error');
      return;
    }

    const unidad = this.unidadesActuales.find(u => u.id === unidadId);
    const nombreUnidad = unidad ? unidad.nombre : `Unidad ID ${unidadId}`;

    // Usar SweetAlert2 para confirmación
    const confirmar = await this.alertasService.confirmarEliminacion(
      `la unidad "${nombreUnidad}"`
    );

    if (!confirmar) return;

    // Mostrar alerta adicional por ser eliminación permanente
    const confirmarPermanente = await this.alertasService.confirmarAccion(
      '⚠️ Eliminación Permanente',
      'Esta acción NO se puede deshacer. La unidad será eliminada completamente del sistema.',
      'Sí, eliminar permanentemente',
      'Cancelar'
    );

    if (!confirmarPermanente) return;

    this.propiedadService.eliminarUnidad(unidadId).subscribe({
      next: (response) => {
        if (response.success || response.mensaje) {
          // ACTUALIZACIÓN INMEDIATA DEL UI
          this.actualizarUITrasEliminacion(unidadId);

          const mensajeExito = response.mensaje || 'Unidad eliminada exitosamente';
          this.alertasService.mostrarExito(mensajeExito);
        } else {
          this.alertasService.mostrarError('No se pudo confirmar la eliminación');
        }
      },
      error: (error) => {
        this.alertasService.manejarErrores(error, 'eliminación de unidad');
      }
    });
  }

  // MÉTODO NUEVO: Actualizar UI tras eliminación exitosa
  private actualizarUITrasEliminacion(unidadId: number): void {
    // 1. Remover la unidad de la lista actual
    const indiceUnidad = this.unidadesActuales.findIndex(u => u.id === unidadId);
    if (indiceUnidad !== -1) {
      this.unidadesActuales.splice(indiceUnidad, 1);
    }

    // 2. Actualizar el contador
    if (this.propiedadExpandida && this.unidadesPorPropiedad[this.propiedadExpandida] > 0) {
      this.unidadesPorPropiedad[this.propiedadExpandida] = this.unidadesActuales.length;
    }
  }

  // Métodos existentes
  contarUnidades(propiedadId: number): number {
    return this.unidadesPorPropiedad[propiedadId] || 0;
  }

  agregarUnidad(propiedadId: number): void {
    if (!propiedadId || isNaN(propiedadId)) {
      this.alertasService.mostrarError('ID de propiedad inválido', 'Error');
      return;
    }

    this.router.navigate(['/rentero/propiedades', propiedadId, 'nueva-unidad']);
  }

  navegarAFormulario(): void {
    this.router.navigate(['/rentero/formulario']);
  }

  editarPropiedad(propiedadId: number): void {
    this.router.navigate(['/rentero/formulario', propiedadId]);
  }

  eliminarPropiedad(propiedadId: number): void {
    // Buscar la propiedad para obtener su nombre
    const propiedad = this.propiedades.find(p => p.id === propiedadId);
    if (!propiedad) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo encontrar la propiedad a eliminar'
      });
      return;
    }

    // Obtener el conteo de unidades
    const unidadesCount = this.contarUnidades(propiedadId);

    // Construir el mensaje de confirmación
    let mensaje = `¿Estás seguro de eliminar la propiedad "${propiedad.nombre}"?`;
    if (unidadesCount > 0) {
      mensaje += `\n\n Esta propiedad tiene ${unidadesCount} ${unidadesCount === 1 ? 'unidad' : 'unidades'} que también serán eliminadas.`;
    }
    mensaje += `\n\nEsta acción no se puede deshacer.`;

    Swal.fire({
      title: 'Confirmar eliminación',
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando propiedad...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al servicio para eliminar
        this.propiedadService.eliminarPropiedd(propiedadId).subscribe({
          next: (response) => {
            if (response.success) {
              // Actualizar la lista de propiedades
              this.propiedades = this.propiedades.filter(p => p.id !== propiedadId);

              // Actualizar contadores de unidades
              delete this.unidadesPorPropiedad[propiedadId];

              // Cerrar loading y mostrar éxito
              Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: response.mensaje || 'La propiedad ha sido eliminada exitosamente',
                timer: 2000,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.mensaje || 'No se pudo eliminar la propiedad'
              });
            }
          },
          error: (error) => {
            let mensajeError = 'Error interno del servidor';

            if (error.status === 404) {
              mensajeError = 'La propiedad no existe o ya fue eliminada';
            } else if (error.status === 403) {
              mensajeError = 'No tienes permisos para eliminar esta propiedad';
            } else if (error.status === 400) {
              mensajeError = error.error?.mensaje || 'No se puede eliminar esta propiedad';
            } else if (error.error?.mensaje) {
              mensajeError = error.error.mensaje;
            }

            Swal.fire({
              icon: 'error',
              title: 'Error al eliminar',
              text: mensajeError,
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  trackByPropiedadId(index: number, propiedad: PropiedadBackend): number {
    return propiedad?.id || index;
  }

  trackByUnidadId(index: number, unidad: Unidad): number {
    return unidad?.id || index;
  }

  // Método para formatear precio
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  // MÉTODO CORREGIDO: obtenerServicios
  obtenerServicios(unidad: Unidad): string {
    if (unidad.descripcion && unidad.descripcion.servicios && Array.isArray(unidad.descripcion.servicios)) {
      return unidad.descripcion.servicios.join(', ');
    }
    return 'Sin servicios especificados';
  }

  // MÉTODOS NUEVOS: Para manejar estado en lugar de disponible
  esUnidadDisponible(unidad: Unidad): boolean {
    // Usar el método del servicio para convertir estado a disponible
    return this.propiedadService.estadoADisponible(unidad.estado);
  }

  obtenerEstadoTexto(unidad: Unidad): string {
    // Usar el método del servicio para formatear estado
    return this.propiedadService.formatearEstado(unidad.estado);
  }

  obtenerClaseEstado(unidad: Unidad): string {
    switch (unidad.estado) {
      case 'libre':
        return 'disponible';
      case 'ocupada':
        return 'ocupada';
      case 'mantenimiento':
        return 'mantenimiento';
      default:
        return 'desconocido';
    }
  }

  recargarDatos(): void {
    this.alertasService.mostrarInfo('Recargando datos...', 'Actualizando');
    this.cargarPropiedades();

    if (this.propiedadExpandida) {
      this.cargarUnidadesDetalle(this.propiedadExpandida);
    }
  }
}
