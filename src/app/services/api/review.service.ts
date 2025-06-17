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

  /**
   * Verifica si el usuario ya tiene una reseña para un negocio específico
   */
  getUserReviewForBusiness(businessId: number): Observable<Review | null> {
    return this.getWithAuth(`${this.apiUrl}/reviews/user/business/${businessId}`);
  }

  /**
   * Crea o actualiza una reseña según si ya existe
   * Si el usuario ya tiene una reseña para este negocio, la actualiza
   * Si no existe, crea una nueva
   */
  createOrUpdateReview(reviewData: { 
    business_id: number; 
    rating: number; 
    comment?: string; 
    booking_id?: number 
  }): Observable<any> {
    return new Observable(observer => {
      // Primero verificar si ya existe una reseña del usuario para este negocio
      this.getUserReviewForBusiness(reviewData.business_id).subscribe({
        next: (existingReview) => {
          if (existingReview && existingReview.id) {
            // Ya existe una reseña, actualizarla
            this.updateReview(
              existingReview.id, 
              reviewData.rating, 
              reviewData.comment || ''
            ).subscribe({
              next: (updatedReview) => {
                observer.next({
                  success: true,
                  message: 'Reseña actualizada exitosamente',
                  data: updatedReview,
                  action: 'updated'
                });
                observer.complete();
              },
              error: (error) => {
                observer.error(error);
              }
            });
          } else {
            // No existe una reseña, crear una nueva
            this.createReview(reviewData).subscribe({
              next: (newReview) => {
                observer.next({
                  success: true,
                  message: 'Reseña creada exitosamente',
                  data: newReview,
                  action: 'created'
                });
                observer.complete();
              },
              error: (error) => {
                observer.error(error);
              }
            });
          }
        },
        error: (error) => {
          this.createReview(reviewData).subscribe({
            next: (newReview) => {
              observer.next({
                success: true,
                message: 'Reseña creada exitosamente',
                data: newReview,
                action: 'created'
              });
              observer.complete();
            },
            error: (createError) => {
              observer.error(createError);
            }
          });
        }
      });
    });
  }

  upsertReview(reviewData: { 
    business_id: number; 
    rating: number; 
    comment?: string; 
    booking_id?: number 
  }): Observable<any> {
    return this.postWithAuth(`${this.apiUrl}/reviews/upsert`, reviewData);
  }
}
