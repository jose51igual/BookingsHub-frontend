import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Review, ApiResponse } from '@interfaces/index';

@Injectable({
  providedIn: 'root'
})
export class ReviewService extends BaseApiService {

  /**
   * Obtiene las reseñas de un negocio
   */
  getBusinessReviews(businessId: number): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/reviews/business/${businessId}`, this.httpOptions).pipe(
      retry(2),
      map((response: ApiResponse<Review[]>) => {
        return response.data || response as any;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea una nueva reseña
   */
  createReview(reviewData: { business_id: number; rating: number; comment?: string; booking_id?: number }): Observable<any> {
    return this.postWithAuth(`${this.apiUrl}/reviews`, reviewData);
  }

  /**
   * Actualiza una reseña existente
   */
  updateReview(reviewId: number, rating: number, comment: string): Observable<Review> {
    return this.putWithAuth(`${this.apiUrl}/reviews/${reviewId}`, { rating, comment });
  }

  /**
   * Elimina una reseña
   */
  deleteReview(reviewId: number): Observable<any> {
    return this.deleteWithAuth(`${this.apiUrl}/reviews/${reviewId}`);
  }

  /**
   * Obtiene una reseña específica por ID
   */
  getReviewById(reviewId: number): Observable<Review> {
    return this.getWithAuth(`${this.apiUrl}/reviews/${reviewId}`);
  }

  /**
   * Obtiene las reseñas realizadas por un usuario
   */
  getUserReviews(userId?: number): Observable<Review[]> {
    const url = userId 
      ? `${this.apiUrl}/reviews/user/${userId}` 
      : `${this.apiUrl}/reviews/user`;
    return this.getWithAuth(url);
  }

  /**
   * Obtiene las estadísticas de reseñas de un negocio
   */
  getBusinessReviewStats(businessId: number): Observable<any> {
    return this.getWithAuth(`${this.apiUrl}/reviews/business/${businessId}/stats`);
  }

  /**
   * Obtiene las reseñas recientes de un negocio
   */
  getRecentReviews(businessId: number, limit: number = 5): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/reviews/business/${businessId}/recent?limit=${limit}`, this.httpOptions).pipe(
      retry(2),
      map((response: ApiResponse<Review[]>) => {
        return response.data || response as any;
      }),
      catchError(error => this.handleError(error))
    );
  }
}
