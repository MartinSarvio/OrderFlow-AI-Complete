/**
 * Site Config Hook
 * Loads configuration from the public API based on host header
 *
 * This hook fetches the tenant's site configuration from the API,
 * which resolves the subdomain/custom domain to the correct tenant.
 */

import { useState, useEffect, useCallback } from 'react';
import type { RestaurantConfig as _RestaurantConfig } from '@/types';

// API base URL - uses same origin or configured API URL
const API_BASE = import.meta.env.VITE_API_URL || '';

export interface SiteConfigResponse {
  tenant: {
    id: string;
    subdomain: string;
    template_id: string;
    custom_domain: string | null;
  };
  config: {
    logo_url: string | null;
    favicon_url: string | null;
    brand_name: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
    font_family: string;
    heading_font: string | null;
    hero_image_url: string | null;
    hero_title: string | null;
    hero_subtitle: string | null;
    display_name: string | null;
    tagline: string | null;
    description: string | null;
    opening_hours: Record<string, any>;
    delivery_zones: any[];
    minimum_order_amount: number;
    delivery_fee: number;
    free_delivery_threshold: number | null;
    payment_methods: string[];
    social_links: Record<string, string>;
    meta_title: string | null;
    meta_description: string | null;
    og_image_url: string | null;
    features: {
      ordering: boolean;
      reservations: boolean;
      loyalty: boolean;
      reviews: boolean;
      blog: boolean;
    };
    custom_css: string | null;
    custom_head_scripts: string | null;
  };
  restaurant: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
    logo_url: string | null;
    opening_hours: Record<string, any> | null;
    delivery_enabled: boolean;
    pickup_enabled: boolean;
    minimum_order_amount: number | null;
    delivery_fee: number | null;
  };
  menu: Array<{
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      compare_at_price: number | null;
      image_url: string | null;
      options: any[];
      dietary_info: Record<string, boolean>;
      allergens: string[] | null;
      is_featured: boolean;
      is_popular: boolean;
    }>;
  }>;
  features: {
    ordering: boolean;
    reservations: boolean;
    loyalty: boolean;
  };
}

interface UseSiteConfigReturn {
  siteConfig: SiteConfigResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache for site config
let cachedConfig: SiteConfigResponse | null = null;
let cacheHost: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSiteConfig(): UseSiteConfigReturn {
  const [siteConfig, setSiteConfig] = useState<SiteConfigResponse | null>(cachedConfig);
  const [isLoading, setIsLoading] = useState(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    const currentHost = window.location.host;

    // Check cache validity
    if (cachedConfig && cacheHost === currentHost && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSiteConfig(cachedConfig);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/api/public/site-config?host=${encodeURIComponent(currentHost)}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Site not found');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: SiteConfigResponse = await response.json();

      // Update cache
      cachedConfig = data;
      cacheHost = currentHost;
      cacheTimestamp = Date.now();

      setSiteConfig(data);

      // Apply custom CSS if present
      if (data.config?.custom_css) {
        applyCustomCSS(data.config.custom_css);
      }

      // Apply CSS variables for colors
      applyColorVariables(data.config);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load site config';
      setError(message);
      console.error('Site config fetch error:', err);

      // Fallback to default config in dev mode
      if (import.meta.env.DEV) {
        console.warn('Using fallback config in development');
        setSiteConfig(getDefaultDevConfig());
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    siteConfig,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}

/**
 * Apply custom CSS from site config
 */
function applyCustomCSS(css: string): void {
  const existingStyle = document.getElementById('site-custom-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.id = 'site-custom-css';
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Apply color variables from site config
 */
function applyColorVariables(config: SiteConfigResponse['config']): void {
  if (!config) return;

  const root = document.documentElement;

  if (config.primary_color) {
    root.style.setProperty('--color-primary', config.primary_color);
  }
  if (config.secondary_color) {
    root.style.setProperty('--color-secondary', config.secondary_color);
  }
  if (config.accent_color) {
    root.style.setProperty('--color-accent', config.accent_color);
  }
  if (config.background_color) {
    root.style.setProperty('--color-background', config.background_color);
  }
  if (config.text_color) {
    root.style.setProperty('--color-text', config.text_color);
  }
  if (config.font_family) {
    root.style.setProperty('--font-family', config.font_family);
  }
}

/**
 * Default config for development
 */
function getDefaultDevConfig(): SiteConfigResponse {
  return {
    tenant: {
      id: 'dev-tenant',
      subdomain: 'localhost',
      template_id: 'skabelon-1',
      custom_domain: null,
    },
    config: {
      logo_url: null,
      favicon_url: null,
      brand_name: 'Development Restaurant',
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      accent_color: '#06b6d4',
      background_color: '#ffffff',
      text_color: '#1f2937',
      font_family: 'Inter',
      heading_font: null,
      hero_image_url: null,
      hero_title: 'Welcome to Our Restaurant',
      hero_subtitle: 'Delicious food, delivered to you',
      display_name: 'Dev Restaurant',
      tagline: 'Fresh & Fast',
      description: 'Development restaurant for testing',
      opening_hours: {},
      delivery_zones: [],
      minimum_order_amount: 100,
      delivery_fee: 29,
      free_delivery_threshold: 300,
      payment_methods: ['card', 'mobilepay'],
      social_links: {},
      meta_title: null,
      meta_description: null,
      og_image_url: null,
      features: {
        ordering: true,
        reservations: false,
        loyalty: false,
        reviews: false,
        blog: false,
      },
      custom_css: null,
      custom_head_scripts: null,
    },
    restaurant: {
      id: 'dev-restaurant',
      name: 'Development Restaurant',
      address: 'Test Street 123',
      phone: '+45 12 34 56 78',
      email: 'dev@example.com',
      description: 'Development restaurant',
      logo_url: null,
      opening_hours: null,
      delivery_enabled: true,
      pickup_enabled: true,
      minimum_order_amount: 100,
      delivery_fee: 29,
    },
    menu: [],
    features: {
      ordering: true,
      reservations: false,
      loyalty: false,
    },
  };
}

/**
 * Convert API config to RestaurantConfig type (for backwards compatibility)
 */
export function toRestaurantConfig(siteConfig: SiteConfigResponse): any {
  const { config, restaurant, menu } = siteConfig;

  return {
    id: restaurant.id,
    name: config.display_name || restaurant.name,
    tagline: config.tagline || '',
    description: config.description || restaurant.description || '',
    logo: config.logo_url || restaurant.logo_url || '',
    coverImage: config.hero_image_url || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    openingHours: config.opening_hours || restaurant.opening_hours || {},
    socialMedia: config.social_links || {},
    colors: {
      primary: config.primary_color,
      secondary: config.secondary_color,
      accent: config.accent_color,
      background: config.background_color,
      text: config.text_color,
    },
    fonts: {
      heading: config.heading_font || config.font_family,
      body: config.font_family,
    },
    menu: menu.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      items: category.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image_url || '',
        options: item.options || [],
        allergens: item.allergens || [],
        isPopular: item.is_popular,
        isFeatured: item.is_featured,
      })),
    })),
    features: config.features,
    delivery: {
      enabled: restaurant.delivery_enabled,
      fee: config.delivery_fee || restaurant.delivery_fee || 0,
      minimumOrder: config.minimum_order_amount || restaurant.minimum_order_amount || 0,
      freeThreshold: config.free_delivery_threshold || null,
      zones: config.delivery_zones || [],
    },
    pickup: {
      enabled: restaurant.pickup_enabled,
    },
    payment: {
      methods: config.payment_methods,
    },
    updatedAt: new Date().toISOString(),
  };
}
