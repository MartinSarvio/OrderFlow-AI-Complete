// OrderFlow PWA Generator - Theme Hook
import { useMemo } from 'react';
import type { RestaurantConfig, Theme } from '@/types';

export function useTheme(restaurant: RestaurantConfig | null): Theme {
  return useMemo(() => {
    const defaultColors = {
      primary: '#D4380D',
      secondary: '#FFF7E6',
      accent: '#FFA940',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1A1A1A',
      textMuted: '#666666',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#F5222D'
    };

    const colors = restaurant?.branding?.colors || defaultColors;

    return {
      colors,
      fonts: {
        heading: restaurant?.branding?.fonts?.heading || 'Playfair Display',
        body: restaurant?.branding?.fonts?.body || 'Inter'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }
    };
  }, [restaurant]);
}
