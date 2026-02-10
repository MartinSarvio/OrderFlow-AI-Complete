// OrderFlow PWA Generator - Restaurant Hook
import { useState, useEffect, useCallback } from 'react';
import type { RestaurantConfig, MenuCategory, MenuItem } from '@/types';
import { defaultConfig } from '@/data/defaultConfig';

const STORAGE_KEY = 'orderflow_restaurant_config';

export function useRestaurant(restaurantId?: string) {
  const [restaurant, setRestaurant] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load restaurant config from localStorage or use default
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        
        // Try to get from localStorage first
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setRestaurant(JSON.parse(stored));
        } else {
          // Use default config
          setRestaurant(defaultConfig);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load restaurant data');
        // Fallback to default
        setRestaurant(defaultConfig);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();

    // Listen for config updates from admin
    const handleConfigUpdate = (event: CustomEvent<RestaurantConfig>) => {
      setRestaurant(event.detail);
    };

    window.addEventListener('restaurantConfigUpdated', handleConfigUpdate as EventListener);
    
    // Listen for storage events (multi-tab support)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setRestaurant(JSON.parse(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);

    // Listen for postMessage from Web Builder parent (live preview)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_RESTAURANT_CONFIG') {
        const cfg = event.data.config;
        if (!cfg) return;
        // Convert Web Builder config format to RestaurantConfig format
        setRestaurant(prev => {
          const base = prev || defaultConfig;
          const updated = { ...base };

          // Branding
          if (cfg.branding) {
            const b = cfg.branding;
            if (b.name) updated.branding.name = b.name;
            if (b.shortName) updated.branding.shortName = b.shortName;
            if (b.slogan) updated.branding.slogan = b.slogan;
            if (b.description) updated.branding.description = b.description;
            if (b.logo?.url) updated.branding.logo = { ...updated.branding.logo, url: b.logo.url };
            if (b.colors) {
              updated.branding = {
                ...updated.branding,
                colors: { ...updated.branding.colors, ...b.colors }
              };
            }
            if (b.fonts) {
              updated.branding = {
                ...updated.branding,
                fonts: { ...updated.branding.fonts, ...b.fonts }
              };
            }
          }

          // Images
          if (cfg.images) {
            if (cfg.images.hero) updated.branding.heroImage = cfg.images.hero;
          }

          // Contact
          if (cfg.contact) {
            updated.contact = { ...updated.contact, ...cfg.contact };
          }

          // Business Hours
          if (cfg.businessHours) {
            updated.businessHours = { ...updated.businessHours, ...cfg.businessHours };
          }

          // Delivery
          if (cfg.delivery) {
            updated.delivery = { ...updated.delivery, ...cfg.delivery };
          }

          // Features
          if (cfg.features) {
            updated.features = { ...updated.features, ...cfg.features };
          }

          // Apply CSS variables for live color updates
          if (cfg.branding?.colors) {
            const root = document.documentElement;
            const c = cfg.branding.colors;
            if (c.primary) root.style.setProperty('--color-primary', c.primary);
            if (c.secondary) root.style.setProperty('--color-secondary', c.secondary);
            if (c.accent) root.style.setProperty('--color-accent', c.accent);
            if (c.background) root.style.setProperty('--color-background', c.background);
            if (c.text) root.style.setProperty('--color-text', c.text);
          }

          return updated;
        });
      }
      if (event.data && event.data.type === 'RESET_SCROLL') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('message', handleMessage);

    // Notify parent that preview is ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY', template: 'skabelon-1' }, '*');
    }

    return () => {
      window.removeEventListener('restaurantConfigUpdated', handleConfigUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
    };
  }, [restaurantId]);

  const searchMenuItems = useCallback((query: string): MenuItem[] => {
    if (!restaurant || !query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results: MenuItem[] = [];

    restaurant.menu.categories.forEach(category => {
      category.items.forEach(item => {
        if (
          item.name.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        ) {
          results.push(item);
        }
      });
    });

    return results;
  }, [restaurant]);

  const getItemById = useCallback((itemId: string): MenuItem | undefined => {
    if (!restaurant) return undefined;

    for (const category of restaurant.menu.categories) {
      const item = category.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return undefined;
  }, [restaurant]);

  const getCategoryById = useCallback((categoryId: string): MenuCategory | undefined => {
    if (!restaurant) return undefined;
    return restaurant.menu.categories.find(c => c.id === categoryId);
  }, [restaurant]);

  const isOpen = useCallback((): boolean => {
    if (!restaurant) return false;

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDay = dayNames[now.getDay()];
    const dayHours = restaurant.businessHours[currentDay];

    if (dayHours.closed) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime < closeTime;
  }, [restaurant]);

  const getNextOpeningTime = useCallback((): string => {
    if (!restaurant) return '';

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDayIndex = now.getDay();

    // Check remaining days of the week
    for (let i = 0; i < 7; i++) {
      const dayIndex = (currentDayIndex + i) % 7;
      const dayName = dayNames[dayIndex];
      const dayHours = restaurant.businessHours[dayName];

      if (!dayHours.closed) {
        if (i === 0) {
          // Today - check if still opening later
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const [openHour, openMin] = dayHours.open.split(':').map(Number);
          const openTime = openHour * 60 + openMin;

          if (currentTime < openTime) {
            return `I dag kl. ${dayHours.open}`;
          }
        } else {
          const dayNamesDanish = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
          return `${dayNamesDanish[dayIndex]} kl. ${dayHours.open}`;
        }
      }
    }

    return 'Ukendt';
  }, [restaurant]);

  return {
    restaurant,
    loading,
    error,
    searchMenuItems,
    getItemById,
    getCategoryById,
    isOpen,
    getNextOpeningTime
  };
}
