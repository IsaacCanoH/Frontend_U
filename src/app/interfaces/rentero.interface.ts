export interface Rentero {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface FormularioRegistroRentero {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface RespuestaSubidaArchivo {
  exito: boolean;
  mensaje: string;
  rutaArchivo?: string
}

export interface RespuestaRegistroRentero {
  exito: boolean;
  mensaje: string;
  rentero?: Rentero;
  errores?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  exito: boolean;
  mensaje: string;
  datos: {
    rentero: {
      id: number;
      nombre: string;
      apellido: string;
      email: string;
      telefono: string;
    };
    token: string;
  };
}
