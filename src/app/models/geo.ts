/**
 * Interfaces relacionadas con geolocalización y mapas
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  country?: string;
  postal_code?: string;
  formatted_address?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GoogleGeocodeResult {
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      }
    }
  }[];
  status: string;
}

export interface GoogleCoordinates {
  lat: number;
  lng: number;
}

export interface GoogleAuthResponse {
  idToken: string;
  accessToken?: string;
  name?: string;
  email?: string;
  familyName?: string;
  givenName?: string;
  imageUrl?: string;
}
