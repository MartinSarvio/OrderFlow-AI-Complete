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

    return () => {
      window.removeEventListener('restaurantConfigUpdated', handleConfigUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
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
