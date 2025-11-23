export interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface FormularioRegistroEstudiante {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
}

export interface RespuestaRegistroEstudiante {
  exito: boolean;
  mensaje: string;
  estudiante?: Estudiante;
  errores?: string[];
}

export interface LoginEstudianteRequest {
  email: string;
  password: string;
}

export interface LoginEstudianteResponse {
  exito: boolean;
  mensaje: string;
  datos: {
    estudiante: {
      id: number;
      nombre: string;
      apellido: string;
      email: string;
      telefono: string;
    };
    token: string;
  };
}
