import { Rentero } from "./rentero.interface";

// ========== INTERFACES BASE ==========

export interface Descripcion {
  terraza?: boolean;
  amueblado?: boolean;
  servicios?: string[];
  caracteristicas?: string;
  tamaño?: string;
  mobiliario?: string[];
  [key: string]: any;
}

export interface Ubicacion {
  nombre: string;
  direccion: string;
  calle: string;
  colonia: string;
  numero: string;
  codigo_postal: string;
  municipio: string | null;
  estado: string | null;
  coordenadas: {
    crs: {
      type: string;
      properties: {
        name: string;
      };
    };
    type: string;
    coordinates: number[];
  };
}

// ========== INTERFACES DE PROPIEDAD ==========

export interface Propiedad {
  id: number;
  nombre: string;
  precio: number;
  estado: string;
  descripcion: Descripcion;
  imagenes: string[];
  ubicacion: Ubicacion;
  rentero: Rentero;
}

export interface PropiedadBackend {
  id: number;
  nombre: string;
  calle: string;
  colonia: string;
  numero: string;
  codigo_postal?: string;
  municipio: string;
  estado?:string | null,
  visible?: boolean;
}

export interface FormularioRegistroPropiedad {
  nombre: string;
  ubicacion: Ubicacion;
  rentero_id: number;
}

export interface PropiedadNueva {
  id: number;
  rentero_id: number;
  nombre: string;
  ubicacion: Ubicacion;
  visible: boolean;
}

// ========== INTERFACES DE UNIDAD (CORREGIDAS) ==========

export interface Unidad {
  id: number;
  propiedad_id: number;
  nombre: string;
  precio: number;
  estado: 'libre' | 'ocupada' | 'mantenimiento';
  descripcion?: Descripcion | null;
  imagenes?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
  propiedad_nombre?: string;
}

export interface FormularioRegistroUnidad {
  propiedad_id: number;
  nombre: string;
  precio: number;
  descripcion?: Descripcion;
  imagenes?: string[];
}

export interface FormularioActualizacionUnidad {
  nombre?: string;
  precio?: number;
  estado?: 'libre' | 'ocupada' | 'mantenimiento';
  descripcion?: Descripcion;
  imagenes?: string[];
}

// Nueva interface para la respuesta completa del endpoint obtenerUnidadPorId
export interface UnidadCompleta {
  id: number;
  nombre: string;
  precio: number;
  estado: 'libre' | 'ocupada' | 'mantenimiento';
  descripcion?: Descripcion | null;
  imagenes?: string[] | null;
  propiedad_id: number;
  ubicacion: Ubicacion;
  rentero: Rentero;
}

// ========== INTERFACES DE RESPUESTA ==========

export interface ApiResponse {
  success: boolean;
  cantidad?: number;
  data?: Propiedad[];
  filtros?: any;
}

export interface SinglePropertyResponse {
  success: boolean;
  data?: Propiedad;
}

export interface PropiedadesRenteroResponse {
  success: boolean;
  cantidad?: number;
  data?: PropiedadBackend[];
}

export interface UnidadesResponse {
  success: boolean;
  cantidad: number;
  propiedad?: {
    id: number;
    nombre: string;
  };
  data: Unidad[];
}

export interface SingleUnidadResponse {
  success: boolean;
  mensaje?: string;
  data: Unidad;
}

export interface SingleUnidadCompletaResponse {
  success: boolean;
  mensaje?: string;
  data: UnidadCompleta;
}

export interface RegistroUnidadResponse {
  success: boolean;
  mensaje: string;
  data: Unidad;
}

export interface EliminacionUnidadResponse {
  success: boolean;
  mensaje: string;
  unidadId: number;
}

export interface EliminarPropiedadRenteroResponse {
  success: boolean;
  mensaje: string;
  propiedadId: number;
}

export interface ErrorResponse {
  error: string;
  mensaje?: string;
  message?: string;
  detalle?: string;
}
