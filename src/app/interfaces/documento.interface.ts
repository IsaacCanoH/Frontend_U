export interface Documento {
  id: number;
  tipo_id: string;
  ruta_archivo:string,
  rentero_id: number;
  propiedad_id: number;
}

export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion?: string;
}