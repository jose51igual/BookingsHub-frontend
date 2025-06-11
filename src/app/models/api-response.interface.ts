/**
 * Interfaz para las respuestas estándar de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message: string;
}

/**
 * Interfaz para respuestas de error de la API
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  data?: null;
}

/**
 * Tipo unión para respuestas de la API
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
