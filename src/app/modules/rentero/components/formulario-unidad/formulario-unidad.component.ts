import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import { AlertasService } from '../../../../core/services/alertas.service';
import {
  FormularioRegistroUnidad,
  FormularioActualizacionUnidad,
  UnidadCompleta
} from '../../../../interfaces/propiedad.interface';
import { ServiciosService } from '../../../../core/services/servicios.service';

@Component({
  selector: 'app-formulario-unidad',
  templateUrl: './formulario-unidad.component.html',
  styleUrl: './formulario-unidad.component.scss'
})
export class FormularioUnidadComponent implements OnInit, OnDestroy {
  formularioUnidad: FormGroup;
  procesando = false;
  propiedadId: number = 0;
  unidadId: number = 0;
  propiedadNombre = '';
  esEdicion = false;
  unidadActual: UnidadCompleta | null = null;

  serviciosCatalogo: any[] = [];
  serviciosBase: any[] = [];
  serviciosExtras: any[] = [];
  serviciosSeleccionados: number[] = []; // IDs de servicios

  // Propiedades para manejo de archivos
  imagenesSeleccionadas: File[] = [];
  urlsPreview: string[] = [];
  maxImagenes = 10;
  maxTamanoMB = 5;
  formatosPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propiedadService: PropiedadService,
    private alertasService: AlertasService,
    private serviciosService: ServiciosService
  ) {
    this.formularioUnidad = this.crearFormulario();

    // Suscribir cambios de "compartido" para activar/desactivar validadores
    const sub = this.formularioUnidad.get('compartido')!.valueChanges.subscribe((v: boolean) => {
      const cant = this.formularioUnidad.get('compartido_cantidad')!;
      const precio = this.formularioUnidad.get('compartido_precio')!;
      if (v) {
        cant.setValidators([Validators.required, Validators.min(1)]);
        precio.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        cant.clearValidators();
        precio.clearValidators();
        // valores por defecto cuando no es compartido
        cant.setValue(1, { emitEvent: false });
        precio.setValue(0, { emitEvent: false });
      }
      cant.updateValueAndValidity({ emitEvent: false });
      precio.updateValueAndValidity({ emitEvent: false });
    });
    this.subs.push(sub);
  }

  ngOnInit(): void {
    this.detectarModo();
    this.inicializarFormulario();
    this.cargarServiciosCatalogo();
  }

  ngOnDestroy(): void {
    this.limpiarPrevisualizaciones();
    this.subs.forEach(s => s.unsubscribe());
  }

  private detectarModo(): void {
    const params = this.route.snapshot.params;

    if (this.route.snapshot.url.some(segment => segment.path === 'nueva-unidad')) {
      this.esEdicion = false;
      this.propiedadId = +params['propiedadId'];

      if (!this.propiedadId || this.propiedadId === 0 || isNaN(this.propiedadId)) {
        this.alertasService.mostrarError('ID de propiedad inválido', 'Error de navegación');
        this.router.navigate(['/rentero']);
        return;
      }

      this.cargarNombrePropiedad();
    } else if (this.route.snapshot.url.some(segment => segment.path === 'editar')) {
      this.esEdicion = true;
      this.unidadId = +params['unidadId'];

      if (!this.unidadId || this.unidadId === 0 || isNaN(this.unidadId)) {
        this.alertasService.mostrarError('ID de unidad inválido', 'Error de navegación');
        this.router.navigate(['/rentero']);
        return;
      }

      this.cargarUnidadParaEdicion();
    }
  }

  private crearFormulario(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      precio: ['', [Validators.required, Validators.min(1)]],
      terraza: [false],
      amueblado: [false],
      caracteristicas: [''],
      // nuevos campos para compartido (sin validadores iniciales; se activan si se marca compartido)
      compartido: [false],
      compartido_cantidad: [1],
      compartido_precio: [0]
    });
  }

  private inicializarFormulario(): void {
    if (!this.esEdicion) {
      const fechaHora = new Date().toLocaleString('es-MX');
      this.formularioUnidad.patchValue({
        nombre: `Unidad ${fechaHora}`
      });
    }
    this.formularioUnidad.updateValueAndValidity();
  }

  private cargarNombrePropiedad(): void {
    if (!this.propiedadId) return;

    this.propiedadService.obtenerPropiedadesDelRentero().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const propiedad = response.data.find((p: any) => p.id === this.propiedadId);
          if (propiedad) {
            this.propiedadNombre = propiedad.nombre;
          } else {
            this.propiedadNombre = `Propiedad ID: ${this.propiedadId}`;
          }
        }
      },
      error: (error) => {
        this.propiedadNombre = `Propiedad ID: ${this.propiedadId}`;
        this.alertasService.manejarErrores(error, 'carga del nombre de propiedad');
      }
    });
  }

  private cargarUnidadParaEdicion(): void {
    this.propiedadNombre = 'Cargando...';

    this.propiedadService.obtenerUnidadCompletaPorId(this.unidadId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unidadActual = response.data;
          this.llenarFormularioConDatos(this.unidadActual);
          this.propiedadId = this.unidadActual.propiedad_id;
          this.propiedadNombre = this.unidadActual.ubicacion.nombre;
        }
      },
      error: (error) => {
        this.alertasService.manejarErrores(error, 'carga de datos de la unidad');
        this.router.navigate(['/rentero']);
      }
    });
  }

  private cargarServiciosCatalogo(): void {
    this.serviciosService.obtenerServiciosDisponibles().subscribe({
      next: (resp) => {
        // el backend devuelve { success:true, data: [...] } o directamente [...]
        const lista = Array.isArray(resp) ? resp : (resp?.data ?? []);
        this.serviciosCatalogo = lista;
        this.serviciosBase = this.serviciosCatalogo.filter(s => !!s.es_base);
        this.serviciosExtras = this.serviciosCatalogo.filter(s => !s.es_base);

        // si estamos en edición y ya existe unidadActual, sincronizar selección
        if (this.unidadActual) {
          const serv = this.unidadActual.descripcion?.servicios || [];
          // admitir que vengan ids (recomendado) o nombres
          this.serviciosSeleccionados = serv.map((x: any) => Number(x)).filter((n: number) => !isNaN(n));
        }
      },
      error: (err) => {
        this.alertasService.manejarErrores(err, 'carga de servicios');
      }
    });
  }


  private llenarFormularioConDatos(unidad: UnidadCompleta): void {
    this.formularioUnidad.patchValue({
      nombre: unidad.nombre || '',
      precio: unidad.precio || 0,
      terraza: unidad.descripcion?.terraza || false,
      amueblado: unidad.descripcion?.amueblado || false,
      caracteristicas: unidad.descripcion?.caracteristicas || '',
      // campos de compartido (si vienen)
    });

    this.serviciosSeleccionados = (unidad.descripcion?.servicios || [])
      .map((s: any) => (typeof s === 'object' ? s.id : Number(s)))
      .filter((n: number) => !isNaN(n));

    // Cargar imágenes existentes como URLs de preview
    if (unidad.imagenes && unidad.imagenes.length > 0) {
      this.urlsPreview = [...unidad.imagenes];
    }
  }

  // ========== MANEJO DE SERVICIOS ==========

  toggleServicio(servicioId: number): void {
    const id = Number(servicioId);
    const idx = this.serviciosSeleccionados.indexOf(id);
    if (idx === -1) this.serviciosSeleccionados.push(id);
    else this.serviciosSeleccionados.splice(idx, 1);
  }

  isServicioSeleccionado(servicioId: number): boolean {
    return this.serviciosSeleccionados.includes(Number(servicioId));
  }


  // ========== MANEJO DE IMÁGENES ==========

  onImagenesSeleccionadas(event: Event): void {
    const archivos = (event.target as HTMLInputElement).files;
    if (!archivos) return;

    // Limpiar previsualizaciones anteriores de archivos (mantener URLs existentes si es edición)
    this.limpiarPrevisualizacionesDeArchivos();

    // Procesar cada archivo
    Array.from(archivos).forEach(archivo => {
      if (this.validarImagen(archivo)) {
        this.imagenesSeleccionadas.push(archivo);
        this.crearPreview(archivo);
      }
    });

    // Limpiar el input
    (event.target as HTMLInputElement).value = '';
  }

  private validarImagen(archivo: File): boolean {
    if (this.urlsPreview.length >= this.maxImagenes) {
      this.alertasService.mostrarAdvertencia(
        `Solo puedes agregar hasta ${this.maxImagenes} imágenes`,
        'Límite alcanzado'
      );
      return false;
    }

    if (!this.formatosPermitidos.includes(archivo.type)) {
      this.alertasService.mostrarError(
        `Formato no permitido: ${archivo.type}. Solo se permiten JPG, PNG y WebP`,
        'Formato no válido'
      );
      return false;
    }

    const tamanoMB = archivo.size / (1024 * 1024);
    if (tamanoMB > this.maxTamanoMB) {
      this.alertasService.mostrarError(
        `La imagen "${archivo.name}" pesa ${tamanoMB.toFixed(1)}MB. El máximo permitido es ${this.maxTamanoMB}MB`,
        'Archivo muy grande'
      );
      return false;
    }

    return true;
  }

  private crearPreview(archivo: File): void {
    const url = URL.createObjectURL(archivo);
    this.urlsPreview.push(url);
  }

  eliminarImagen(index: number): void {
    // Si es una imagen nueva (archivo)
    if (index >= (this.urlsPreview.length - this.imagenesSeleccionadas.length)) {
      const archivoIndex = index - (this.urlsPreview.length - this.imagenesSeleccionadas.length);
      this.imagenesSeleccionadas.splice(archivoIndex, 1);
    }

    // Liberar memoria y eliminar de preview
    if (this.urlsPreview[index] && this.urlsPreview[index].startsWith('blob:')) {
      URL.revokeObjectURL(this.urlsPreview[index]);
    }
    this.urlsPreview.splice(index, 1);
  }

  private limpiarPrevisualizacionesDeArchivos(): void {
    this.urlsPreview.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    const urlsExistentes = this.urlsPreview.filter(url => !url.startsWith('blob:'));
    this.urlsPreview = [...urlsExistentes];
    this.imagenesSeleccionadas = [];
  }

  private limpiarPrevisualizaciones(): void {
    this.urlsPreview.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.urlsPreview = [];
    this.imagenesSeleccionadas = [];
  }

  // ========== GETTERS ==========

  get hayImagenes(): boolean {
    return this.urlsPreview.length > 0;
  }

  get textoBotonImagenes(): string {
    const cantidad = this.imagenesSeleccionadas.length;
    return cantidad === 1 ? '1 imagen seleccionada' : `${cantidad} imágenes seleccionadas`;
  }

  get esCompartido(): boolean {
    return !!this.formularioUnidad.get('compartido')?.value;
  }

  // ========== CONVERSIÓN DE IMÁGENES ==========

  private async convertirImagenesABase64(): Promise<string[]> {
    if (this.imagenesSeleccionadas.length === 0) {
      return [];
    }

    const promesas = this.imagenesSeleccionadas.map(archivo =>
      this.convertirArchivoABase64(archivo)
    );

    const imagenesBase64 = await Promise.all(promesas);
    return imagenesBase64;
  }

  private convertirArchivoABase64(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });
  }

  // ========== GUARDAR UNIDAD ==========

  async guardarUnidad(): Promise<void> {
    if (!this.formularioUnidad.valid) {
      this.mostrarErroresFormulario();
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.alertasService.mostrarError('No estás autenticado', 'Error de autenticación');
      this.router.navigate(['/login']);
      return;
    }

    if (this.esEdicion) {
      await this.actualizarUnidad();
    } else {
      await this.crearUnidad();
    }
  }

  private mostrarErroresFormulario(): void {
    Object.keys(this.formularioUnidad.controls).forEach(key => {
      const control = this.formularioUnidad.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
    this.alertasService.mostrarError(
      'Por favor completa todos los campos requeridos',
      'Formulario incompleto'
    );
  }

  private async crearUnidad(): Promise<void> {
    this.procesando = true;
    const formValue = this.formularioUnidad.value;

    if (!this.propiedadId || this.propiedadId === 0 || isNaN(this.propiedadId)) {
      this.procesando = false;
      this.alertasService.mostrarError('ID de propiedad inválido', 'Error de datos');
      return;
    }

    // Validación extra para compartido
    if (formValue.compartido) {
      const cantidad = Number(formValue.compartido_cantidad);
      const precioPersona = Number(formValue.compartido_precio);
      if (!cantidad || cantidad < 1) {
        this.procesando = false;
        this.alertasService.mostrarError('La cantidad de personas debe ser al menos 1', 'Validación');
        return;
      }
      if (!precioPersona || precioPersona <= 0) {
        this.procesando = false;
        this.alertasService.mostrarError('El precio por persona debe ser mayor que 0', 'Validación');
        return;
      }
    }

    try {
      // Convertir imágenes a base64 si hay archivos seleccionados
      let imagenesBase64: string[] = [];
      if (this.imagenesSeleccionadas.length > 0) {
        imagenesBase64 = await this.convertirImagenesABase64();
      }

      const serviciosObj = this.serviciosSeleccionados
        .map(id => this.serviciosCatalogo.find((s: any) => Number(s.id) === Number(id)))
        .filter((s: any) => !!s)
        .map((s: any) => ({ id: s.id, nombre: s.nombre, precio: s.precio, es_base: !!s.es_base }));

      const descripcion: any = {
        terraza: !!formValue.terraza,
        amueblado: !!formValue.amueblado,
        servicios: serviciosObj,
        caracteristicas: formValue.caracteristicas || ''
      };

      const datosUnidad: FormularioRegistroUnidad = {
        propiedad_id: this.propiedadId,
        nombre: formValue.nombre || `Unidad ${Date.now()}`,
        precio: parseFloat(formValue.precio),
        descripcion,
        imagenes: imagenesBase64
      };

      this.propiedadService.registrarUnidad(datosUnidad).subscribe({
        next: (response) => {
          this.procesando = false;
          if (response.success || response.mensaje) {
            this.alertasService.mostrarExito(
              response.mensaje || 'Unidad registrada exitosamente'
            );
            this.volverAPropiedades();
          } else {
            this.alertasService.mostrarError('Error al registrar la unidad');
          }
        },
        error: (error) => {
          this.procesando = false;
          this.alertasService.manejarErrores(error, 'registro de unidad');
        }
      });
    } catch (error) {
      this.procesando = false;
      console.error('❌ Error al procesar imágenes:', error);
      this.alertasService.mostrarError('Error al procesar las imágenes');
    }
  }

  private async actualizarUnidad(): Promise<void> {
    this.procesando = true;
    const formValue = this.formularioUnidad.value;

    // Validación extra para compartido
    if (formValue.compartido) {
      const cantidad = Number(formValue.compartido_cantidad);
      const precioPersona = Number(formValue.compartido_precio);
      if (!cantidad || cantidad < 1) {
        this.procesando = false;
        this.alertasService.mostrarError('La cantidad de personas debe ser al menos 1', 'Validación');
        return;
      }
      if (!precioPersona || precioPersona <= 0) {
        this.procesando = false;
        this.alertasService.mostrarError('El precio por persona debe ser mayor que 0', 'Validación');
        return;
      }
    }

    try {
      // Combinar imágenes existentes con nuevas
      let imagenesFinales: string[] = [];

      // Mantener imágenes existentes (URLs que no son blob)
      const imagenesExistentes = this.urlsPreview.filter(url => !url.startsWith('blob:'));
      imagenesFinales = [...imagenesExistentes];

      // Agregar nuevas imágenes convertidas a base64
      if (this.imagenesSeleccionadas.length > 0) {
        const imagenesNuevas = await this.convertirImagenesABase64();
        imagenesFinales = [...imagenesFinales, ...imagenesNuevas];
      }

      const descripcion: any = {
        terraza: formValue.terraza || false,
        amueblado: formValue.amueblado || false,
        servicios: this.serviciosSeleccionados,
        caracteristicas: formValue.caracteristicas || ''
      };

      if (formValue.compartido) {
        descripcion.compartido = true;
        descripcion.compartido_cantidad = Number(formValue.compartido_cantidad) || 1;
        descripcion.compartido_precio = Number(formValue.compartido_precio) || 0;
      } else {
        descripcion.compartido = false;
      }

      const datosActualizacion: FormularioActualizacionUnidad = {
        nombre: formValue.nombre,
        precio: parseFloat(formValue.precio),
        descripcion,
        imagenes: imagenesFinales
      };

      this.propiedadService.actualizarUnidad(this.unidadId, datosActualizacion).subscribe({
        next: (response) => {
          this.procesando = false;
          if (response.success || response.mensaje) {
            this.alertasService.mostrarExito(
              response.mensaje || 'Unidad actualizada exitosamente'
            );
            this.volverAPropiedades();
          } else {
            this.alertasService.mostrarError('Error al actualizar la unidad');
          }
        },
        error: (error) => {
          this.procesando = false;
          this.alertasService.manejarErrores(error, 'actualización de unidad');
        }
      });
    } catch (error) {
      this.procesando = false;
      console.error('❌ Error al procesar imágenes:', error);
      this.alertasService.mostrarError('Error al procesar las imágenes');
    }
  }

  // ========== NAVEGACIÓN Y UTILIDADES ==========

  volverAPropiedades(): void {
    this.router.navigate(['/rentero']);
  }

  async cancelar(): Promise<void> {
    const confirmar = await this.alertasService.confirmarAccion(
      '¿Cancelar registro?',
      'Se perderán todos los cambios realizados',
      'Sí, cancelar',
      'Continuar editando'
    );

    if (confirmar) {
      this.volverAPropiedades();
    }
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.formularioUnidad.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formularioUnidad.get(campo);
    if (!control?.errors || !control?.touched) return '';

    const err = control.errors;
    if (err['required']) return `${campo} es requerido`;
    if (err['min']) return `El valor debe ser mayor a ${err['min'].min}`;
    if (err['minlength']) return `Debe tener al menos ${err['minlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}
