/**
 * Interfaces relacionadas con notificaciones y configuración
 */

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  showCloseButton?: boolean;
}

export interface LoadingConfig {
  message: string;
  spinner?: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-small';
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface AlertConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  showIcon?: boolean;
  isClosable?: boolean;
  icon?: string;
  buttonText?: string;
  showButton?: boolean;
}

export interface EmptyStateConfig {
  icon: string;
  title: string;
  message: string;
  description?: string;
  actionText?: string;
  showAction?: boolean;
}

export interface MenuItem {
  title: string;
  url: string;
  icon: string;
  badge?: number;
}
