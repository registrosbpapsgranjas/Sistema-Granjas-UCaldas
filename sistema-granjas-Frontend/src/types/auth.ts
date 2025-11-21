export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  nombre: string;
  rol: string;
  rol_id: number;
  email: string;
}

export interface RegisterResponse extends LoginResponse {
  message?: string;
}

export interface RolesResponse {
  roles: Role[];
}
