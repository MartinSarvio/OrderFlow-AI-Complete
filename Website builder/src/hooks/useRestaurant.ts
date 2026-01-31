// OrderFlow PWA Generator - Restaurant Hook
import { useState, useEffect, useCallback } from 'react';
import type { RestaurantConfig, MenuCategory, MenuItem } from '@/types';
import { mockRestaurant } from '@/data/mockData';

export function useRestaurant(restaurantId?: string) {
  const [restaurant, setRestaurant] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        // In production, this would be: fetch(`/api/restaurants/${restaurantId}`)
        await new Promise(resolve => setTimeout(resolve, 500));
        setRestaurant(mockRestaurant);
        setError(null);
      } catch (err) {
        setError('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
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
