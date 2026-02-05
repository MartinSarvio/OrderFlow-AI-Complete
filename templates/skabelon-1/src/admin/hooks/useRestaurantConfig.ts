// Hook to manage restaurant configuration
import { useState, useEffect, useCallback } from 'react';
import type { RestaurantConfig } from '@/types';
import { defaultConfig } from '@/data/defaultConfig';

const STORAGE_KEY = 'orderflow_restaurant_config';

interface UseRestaurantConfigReturn {
  config: RestaurantConfig | null;
  updateConfig: (updates: Partial<RestaurantConfig>) => void;
  saveConfig: () => Promise<void>;
  hasChanges: boolean;
  isLoading: boolean;
  resetConfig: () => void;
}

export function useRestaurantConfig(): UseRestaurantConfigReturn {
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<RestaurantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load config from localStorage on mount
  useEffect(() => {
    const loadConfig = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setConfig(parsed);
          setOriginalConfig(parsed);
        } else {
          // Use default config if nothing stored
          setConfig(defaultConfig);
          setOriginalConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Error loading config:', error);
        setConfig(defaultConfig);
        setOriginalConfig(defaultConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Update config with partial changes
  const updateConfig = useCallback((updates: Partial<RestaurantConfig>) => {
    setConfig(prev => {
      if (!prev) return null;
      return { ...prev, ...updates, updatedAt: new Date().toISOString() };
    });
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback(async () => {
    if (!config) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setOriginalConfig(config);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('restaurantConfigUpdated', { 
        detail: config 
      }));
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }, [config]);

  // Reset to original config
  const resetConfig = useCallback(() => {
    if (originalConfig) {
      setConfig(originalConfig);
    }
  }, [originalConfig]);

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  return {
    config,
    updateConfig,
    saveConfig,
    hasChanges,
    isLoading,
    resetConfig,
  };
}

// Hook to subscribe to config changes in other components
export function useRestaurantConfigSubscription(): RestaurantConfig | null {
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  useEffect(() => {
    const loadConfig = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setConfig(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();

    // Listen for config updates
    const handleUpdate = (event: CustomEvent<RestaurantConfig>) => {
      setConfig(event.detail);
    };

    window.addEventListener('restaurantConfigUpdated', handleUpdate as EventListener);
    
    // Also listen for storage events (for multi-tab support)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setConfig(JSON.parse(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('restaurantConfigUpdated', handleUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return config;
}
