// Utilidades para manejo de ratings y estrellas

/**
 * Genera array de estrellas para mostrar rating
 * @param rating - Rating numérico (0-5)
 * @returns Array de números (1 para estrella llena, 0 para vacía)
 */
export function getStarArray(rating: number): number[] {
  return Array(5).fill(0).map((_, index) => index < rating ? 1 : 0);
}

/**
 * Genera array de números para selección de rating
 * @returns Array [1, 2, 3, 4, 5] para selección interactiva
 */
export function getRatingArray(): number[] {
  return [1, 2, 3, 4, 5];
}

/**
 * Convierte rating numérico a texto descriptivo
 * @param rating - Rating numérico (1-5)
 * @returns Texto descriptivo del rating
 */
export function getRatingText(rating: number): string {
  const texts = [
    '',
    'Muy malo',
    'Malo',
    'Regular',
    'Bueno',
    'Excelente'
  ];
  return texts[rating] || '';
}
