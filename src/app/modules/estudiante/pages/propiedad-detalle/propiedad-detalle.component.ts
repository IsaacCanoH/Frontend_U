import { PropiedadService } from '../../../../core/services/propiedad.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Propiedad } from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-propiedad-detalle',
  templateUrl: './propiedad-detalle.component.html',
  styleUrls: ['./propiedad-detalle.component.scss']
})
export class PropiedadDetalleComponent implements OnInit, OnDestroy {
  propiedad: Propiedad | null = null;
  cargando: boolean = false;
  error: string = '';
  imagenActual: number = 0;

  // Propiedades para coordenadas del mapa
  propiedadLat: number | null = null;
  propiedadLng: number | null = null;

  // Propiedad para el autoplay de imágenes
  private autoplayInterval: any = null;
  private readonly AUTOPLAY_DELAY = 5000; // 5 segundos

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propiedadService: PropiedadService
  ) { }

  ngOnInit(): void {
    // Obtener el ID de la URL
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargarPropiedad(+id); // El + convierte string a number
    } else {
      this.error = 'ID de propiedad no válido';
    }
  }

  ngOnDestroy(): void {
    // Limpiar el autoplay al destruir el componente
    this.clearAutoplay();
  }

  cargarPropiedad(id: number): void {
    this.cargando = true;
    this.error = '';

    this.propiedadService.obtenerPropiedadPorId(id).subscribe({
      next: (response) => {
        console.log('✅ Propiedad cargada:', response);

        if (response.success && response.data) {
          this.propiedad = response.data;

          // Configurar coordenadas si están disponibles
          this.setupCoordinates();

          // Configurar autoplay si hay múltiples imágenes
          if (this.propiedad.imagenes && this.propiedad.imagenes.length > 1) {
            this.setupAutoplay();
          }
        } else {
          this.error = 'No se encontró la propiedad';
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar propiedad:', err);

        if (err.status === 404) {
          this.error = 'Propiedad no encontrada';
        } else if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor';
        } else {
          this.error = 'Error al cargar la propiedad';
        }

        this.cargando = false;
      }
    });
  }

  // Configurar coordenadas para el mapa
  private setupCoordinates(): void {
    if (this.propiedad?.ubicacion?.coordenadas?.coordinates) {
      const coords = this.propiedad.ubicacion.coordenadas.coordinates;

      // Verificar que las coordenadas sean válidas
      if (coords.length >= 2 &&
          typeof coords[0] === 'number' &&
          typeof coords[1] === 'number') {
        // GeoJSON usa [longitud, latitud], pero necesitamos [latitud, longitud]
        this.propiedadLng = coords[0]; // longitud
        this.propiedadLat = coords[1];  // latitud

        console.log('📍 Coordenadas configuradas:', {
          lat: this.propiedadLat,
          lng: this.propiedadLng
        });
      } else {
        console.warn('⚠️ Coordenadas inválidas en la propiedad');
        this.setDefaultCoordinates();
      }
    } else {
      console.warn('⚠️ No hay coordenadas disponibles');
      this.setDefaultCoordinates();
    }
  }

  // Establecer coordenadas por defecto
  private setDefaultCoordinates(): void {
    // Coordenadas de León, Guanajuato como fallback
    this.propiedadLat = 21.1619;
    this.propiedadLng = -101.6971;
    console.log('📍 Usando coordenadas por defecto (León, Guanajuato)');
  }

  // Configurar autoplay para las imágenes
  setupAutoplay(): void {
    this.clearAutoplay(); // Limpiar cualquier autoplay previo

    if (this.propiedad && this.propiedad.imagenes.length > 1) {
      this.autoplayInterval = setInterval(() => {
        this.imagenSiguiente();
      }, this.AUTOPLAY_DELAY);
    }
  }

  // Limpiar autoplay
  clearAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  cambiarImagen(index: number): void {
    if (this.propiedad && index >= 0 && index < this.propiedad.imagenes.length) {
      this.imagenActual = index;
      // Reiniciar autoplay cuando el usuario cambia manualmente
      this.setupAutoplay();
    }
  }

  imagenAnterior(): void {
    if (this.propiedad) {
      this.imagenActual = this.imagenActual === 0
        ? this.propiedad.imagenes.length - 1
        : this.imagenActual - 1;

      // Reiniciar autoplay
      this.setupAutoplay();
    }
  }

  imagenSiguiente(): void {
    if (this.propiedad) {
      this.imagenActual = this.imagenActual === this.propiedad.imagenes.length - 1
        ? 0
        : this.imagenActual + 1;
    }
  }

  contactarRentero(): void {
    if (!this.propiedad?.rentero.telefono) {
      console.warn('No hay teléfono disponible');
      return;
    }

    const telefonoLimpio = this.propiedad.rentero.telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent(
      `Hola ${this.propiedad.rentero.nombre}, me interesa tu propiedad "${this.propiedad.nombre}" en UniRenta`
    );
    const url = `https://wa.me/52${telefonoLimpio}?text=${mensaje}`;

    console.log('📱 Abriendo WhatsApp:', url);
    window.open(url, '_blank');
  }

  volver(): void {
    this.router.navigate(['/']);
  }

  // Método auxiliar para verificar si hay servicios
  tieneServicios(): boolean {
    return !!(this.propiedad?.descripcion?.servicios &&
              this.propiedad.descripcion.servicios.length > 0);
  }
}
