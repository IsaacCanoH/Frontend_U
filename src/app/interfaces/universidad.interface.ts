export interface UniversidadBasica {
  id: number;
  nombre: string;
  coordenadas: [number, number];
}

export interface UniversidadApiResponse {
  success: boolean;
  cantidad?: number;
  data?: UniversidadBasica[];
}
