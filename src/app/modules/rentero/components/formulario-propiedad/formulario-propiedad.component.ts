import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { DocumentoService } from '../../../../core/services/documento.service';
import { DocumentoValidacionService } from '../../../../core/services/documento-validacion.service';
import { PropiedadService } from '../../../../core/services/propiedad.service';
import { RenteroService } from '../../../../core/services/rentero.service';
import { TipoDocumento } from '../../../../interfaces/documento.interface';
import { FormularioRegistroPropiedad } from '../../../../interfaces/propiedad.interface';

@Component({
  selector: 'app-formulario-propiedad',
  templateUrl: './formulario-propiedad.component.html',
  styleUrl: './formulario-propiedad.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ opacity: 0, transform: 'scale(0.9) translateY(-20px)' }))
      ])
    ])
  ]
})
export class FormularioPropiedadComponent implements OnInit, OnDestroy {
  formularioPropiedad: FormGroup;
  esEdicion = false;
  idPropiedad: string | null = null;
  tiposDocumento: TipoDocumento[] = [];
  procesando = false;
  pasoActual = 1;
  archivoSeleccionado: File | null = null;
  urlPrevisualizacion: string | null = null;
  direccionBusqueda: string | null = null;
  coordsIniciales: [number, number] | null = null;

  private readonly CAMPOS_UBICACION = [
    'ubicacionCalle', 'ubicacionNumero', 'ubicacionColonia',
    'ubicacionCodigoPostal', 'ubicacionMunicipio', 'ubicacionEstado'
  ] as const;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private documentoService: DocumentoService,
    private documentoValidacionService: DocumentoValidacionService,
    private propiedadService: PropiedadService,
    private renteroService: RenteroService
  ) {
    this.formularioPropiedad = this.crearFormulario();
  }

  ngOnInit(): void {
    this.detectarModoEdicion();
    this.inicializarComponente();
    this.configurarCambiosDireccion();
  }

  ngOnDestroy(): void {
    this.limpiarPrevisualizacion();
  }

  // ========== DETECCIÓN DE MODO EDICIÓN ==========
  private detectarModoEdicion(): void {
    const params = this.route.snapshot.params;
    this.idPropiedad = params['id'] || null;
    this.esEdicion = !!this.idPropiedad;
  }

  // ========== GETTERS ==========
  get datosValidos(): boolean {
    const campos = ['nombre', ...this.CAMPOS_UBICACION, 'ubicacionLatitud', 'ubicacionLongitud'];
    return campos.every(c => this.formularioPropiedad.get(c)?.valid);
  }

  get archivoValido(): boolean {
    return !!this.archivoSeleccionado && !!this.formularioPropiedad.get('tipoDocumentoId')?.value;
  }

  get esImagen(): boolean {
    return this.archivoSeleccionado?.type?.startsWith('image/') ?? false;
  }

  get esPdf(): boolean {
    return this.archivoSeleccionado?.type === 'application/pdf';
  }

  get mostrarPasos(): boolean {
    return !this.esEdicion;
  }

  // ========== INICIALIZACIÓN ==========
  private crearFormulario(): FormGroup {
    return this.fb.group({
      nombre: [''],
      ubicacionCalle: [''],
      ubicacionColonia: [''],
      ubicacionNumero: [''],
      ubicacionCodigoPostal: [''],
      ubicacionMunicipio: [''],
      ubicacionEstado: [''],
      ubicacionLatitud: [''],
      ubicacionLongitud: [''],
      tipoDocumentoId: [''],
      estado: ['']
    });
  }

  private inicializarComponente(): void {
    this.configurarValidadores();
    if (!this.esEdicion) {
      this.cargarTiposDocumento();
    }
    if (this.esEdicion) {
      this.cargarDatosPropiedad();
    }
    this.inicializarCoordenadas();
  }


  private configurarValidadores(): void {
    this.formularioPropiedad.get('nombre')?.setValidators(Validators.required);
    this.CAMPOS_UBICACION.forEach(campo => {
      this.formularioPropiedad.get(campo)?.setValidators(Validators.required);
    });

    const tipoDoc = this.formularioPropiedad.get('tipoDocumentoId');
    const latCtrl = this.formularioPropiedad.get('ubicacionLatitud');
    const lngCtrl = this.formularioPropiedad.get('ubicacionLongitud');

    if (this.esEdicion) {
      tipoDoc?.clearValidators();
      latCtrl?.clearValidators();
      lngCtrl?.clearValidators();

      this.formularioPropiedad.get('estado')?.setValidators(Validators.required);
    } else {
      tipoDoc?.setValidators(Validators.required);
      latCtrl?.setValidators([Validators.required, Validators.min(-90), Validators.max(90)]);
      lngCtrl?.setValidators([Validators.required, Validators.min(-180), Validators.max(180)]);
    }

    tipoDoc?.updateValueAndValidity({ emitEvent: false });
    latCtrl?.updateValueAndValidity({ emitEvent: false });
    lngCtrl?.updateValueAndValidity({ emitEvent: false });
    this.formularioPropiedad.updateValueAndValidity({ emitEvent: false });
  }

  // ========== CARGA DE DATOS ==========
  cargarTiposDocumento(): void {
    this.documentoService.obtenerTiposDocumento().subscribe({
      next: (tipos) => this.tiposDocumento = tipos,
      error: (error) => this.documentoValidacionService.manejarErrores(error, 'carga de tipos de documento')
    });
  }

  cargarDatosPropiedad(): void {
    if (!this.idPropiedad) return;
    const id = parseInt(this.idPropiedad, 10);

    this.propiedadService.obtenerPropiedadDelRenteroPorId(id).subscribe({
      next: (prop) => {
        if (!prop) {
          this.mostrarError('No se encontró la propiedad solicitada', 'Edición de propiedad');
          return;
        }

        this.formularioPropiedad.patchValue({
          nombre: prop.nombre ?? '',
          ubicacionCalle: prop.calle ?? '',
          ubicacionNumero: prop.numero ?? '',
          ubicacionColonia: prop.colonia ?? '',
          ubicacionCodigoPostal: prop.codigo_postal ?? '',
          ubicacionMunicipio: prop.municipio ?? '',
          ubicacionEstado: prop.estado ?? '',
          estado: prop.visible ? 'Disponible' : 'Ocupada'
        });

        this.formularioPropiedad.markAsPristine();
        this.formularioPropiedad.updateValueAndValidity({ emitEvent: false });


      },
      error: () => this.mostrarError('Error al cargar la propiedad', 'Edición de propiedad')
    });
  }


  // ========== COORDENADAS Y MAPA ==========
  private inicializarCoordenadas(): void {
    const lat = parseFloat(this.formularioPropiedad.get('ubicacionLatitud')?.value);
    const lng = parseFloat(this.formularioPropiedad.get('ubicacionLongitud')?.value);

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      this.coordsIniciales = [lng, lat];
    }
  }

  private configurarCambiosDireccion(): void {
    this.formularioPropiedad.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.direccionBusqueda = this.isDireccionCompleta()
          ? this.CAMPOS_UBICACION.map(c => this.formularioPropiedad.get(c)?.value?.trim()).join(', ')
          : null;
      });
  }

  private isDireccionCompleta(): boolean {
    return this.CAMPOS_UBICACION.every(c => {
      const val = this.formularioPropiedad.get(c)?.value;
      return !!val && String(val).trim() !== '';
    });
  }

  onCoordsChange(ev: { lng: number; lat: number }): void {
    this.formularioPropiedad.patchValue({
      ubicacionLatitud: ev.lat.toFixed(6),
      ubicacionLongitud: ev.lng.toFixed(6)
    }, { emitEvent: false });

    this.coordsIniciales = [ev.lng, ev.lat];
  }

  // ========== PASOS DEL FORMULARIO ==========
  siguientePaso(): void {
    if (this.datosValidos) {
      this.pasoActual = 2;
    } else {
      this.mostrarError('Por favor completa todos los campos del paso 1', 'Formulario incompleto');
    }
  }

  anteriorPaso(): void {
    this.pasoActual = 1;
  }

  // ========== MANEJO DE ARCHIVOS ==========
  onArchivoSeleccionado(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    this.limpiarPrevisualizacion();

    if (archivo && this.documentoValidacionService.procesarDocumento(archivo, 'registro')) {
      this.archivoSeleccionado = archivo;
      this.urlPrevisualizacion = URL.createObjectURL(archivo);
    } else {
      this.archivoSeleccionado = null;
    }
  }

  private limpiarPrevisualizacion(): void {
    if (this.urlPrevisualizacion) {
      URL.revokeObjectURL(this.urlPrevisualizacion);
      this.urlPrevisualizacion = null;
    }
  }

  // ========== GUARDAR PROPIEDAD ==========
  guardarPropiedad(): void {
    if (!this.validarFormulario()) return;

    this.procesando = true;

    if (this.esEdicion) {
      this.actualizarPropiedad();
      return;
    }

    const usuarioActual = this.renteroService.obtenerUsuarioActual();
    if (!usuarioActual) return this.mostrarError('Usuario no autenticado', 'Error de autenticación');

    const datosPropiedad = this.construirDatosPropiedad(usuarioActual.id);
    this.crearPropiedad(datosPropiedad);
  }


  private validarFormulario(): boolean {
    if (!this.formularioPropiedad.valid) {
      this.mostrarError('Por favor completa todos los campos requeridos', 'Formulario incompleto');
      return false;
    }

    if (!this.esEdicion && !this.archivoSeleccionado) {
      this.mostrarError('Debes seleccionar un archivo', 'Archivo requerido');
      return false;
    }

    return true;
  }

  private construirDatosPropiedad(renteroId: number): FormularioRegistroPropiedad {
    const v = this.formularioPropiedad.value;

    return {
      nombre: v.nombre,
      ubicacion: {
        nombre: v.nombre,
        direccion: `${v.ubicacionCalle} ${v.ubicacionNumero}, ${v.ubicacionColonia}`,
        calle: v.ubicacionCalle,
        colonia: v.ubicacionColonia,
        numero: v.ubicacionNumero,
        codigo_postal: v.ubicacionCodigoPostal,
        municipio: v.ubicacionMunicipio,
        estado: v.ubicacionEstado,
        coordenadas: {
          crs: { type: 'name', properties: { name: 'EPSG:4326' } },
          type: 'Point',
          coordinates: [parseFloat(v.ubicacionLongitud), parseFloat(v.ubicacionLatitud)]
        }
      },
      rentero_id: renteroId
    };
  }

  private crearPropiedad(datos: FormularioRegistroPropiedad): void {
    const tipoDocumentoId = parseInt(this.formularioPropiedad.get('tipoDocumentoId')?.value) || 3;

    this.propiedadService.registrarPropiedad(datos, this.archivoSeleccionado!, tipoDocumentoId)
      .subscribe({
        next: () => {
          this.procesando = false;
          this.documentoValidacionService.mostrarExitoPropiedad('Propiedad creada exitosamente');
          this.router.navigate(['/rentero']);
        },
        error: (error) => {
          this.procesando = false;
          this.documentoValidacionService.manejarErrores(error, 'registro de propiedad');
        }
      });
  }

  private construirPayloadActualizacion(): any {
    const v = this.formularioPropiedad.value;

    const visible = String(v.estado || '').toLowerCase() === 'disponible';

    const lat = parseFloat(v.ubicacionLatitud);
    const lng = parseFloat(v.ubicacionLongitud);
    const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

    const ubicacion: any = {
      calle: v.ubicacionCalle,
      colonia: v.ubicacionColonia,
      numero: v.ubicacionNumero,
      codigo_postal: v.ubicacionCodigoPostal,
      municipio: v.ubicacionMunicipio,
      estado: v.ubicacionEstado
    };

    if (hasCoords) {
      ubicacion.type = 'Point';
      ubicacion.coordinates = [lng, lat];
    }

    const payload: any = {
      nombre: v.nombre,
      visible,
      ubicacion
    };

    return payload;
  }


  private actualizarPropiedad(): void {
    if (!this.idPropiedad) return;
    const id = parseInt(this.idPropiedad, 10);

    const payload = this.construirPayloadActualizacion();
    this.propiedadService.actualizarPropiedad(id, payload).subscribe({
      next: () => {
        this.procesando = false;
        this.documentoValidacionService.mostrarExito('Propiedad actualizada exitosamente');
        this.router.navigate(['/rentero']);
      },
      error: (error) => {
        this.procesando = false;
        this.documentoValidacionService.manejarErrores(error, 'actualización de propiedad');
      }
    });
  }


  // ========== NAVEGACIÓN Y UTILIDADES ==========
  cancelar(): void {
    this.router.navigate(['/rentero']);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.formularioPropiedad.get(campo);
    if (!control?.errors || !control?.touched) return '';

    const err = control.errors;
    if (err['required']) return `${campo} es requerido`;
    if (err['email']) return 'Email inválido';
    if (err['pattern']) return 'Formato inválido';
    if (err['minlength']) return `Debe tener al menos ${err['minlength'].requiredLength} caracteres`;
    if (err['min']) return campo.includes('Latitud') ? 'Latitud >= -90' : campo.includes('Longitud') ? 'Longitud >= -180' : `Mínimo: ${err['min'].min}`;
    if (err['max']) return campo.includes('Latitud') ? 'Latitud <= 90' : campo.includes('Longitud') ? 'Longitud <= 180' : `Máximo: ${err['max'].max}`;

    return 'Campo inválido';
  }

  private mostrarError(mensaje: string, titulo: string): void {
    this.procesando = false;
    this.documentoValidacionService.manejarErrores({ mensaje }, titulo);
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.formularioPropiedad.get(campo);
    return !!(control?.invalid && control?.touched);
  }
}
