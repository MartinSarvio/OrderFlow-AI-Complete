// OrderFlow PWA Generator - Offline Banner Component
import { Wifi, WifiOff, Check } from 'lucide-react';
import type { RestaurantConfig } from '@/types';

interface OfflineBannerProps {
  restaurant: RestaurantConfig | null;
  isOnline: boolean;
  wasOffline: boolean;
}

export function OfflineBanner({ restaurant, isOnline, wasOffline }: OfflineBannerProps) {
  if (!restaurant) return null;

  const { branding } = restaurant;

  // Show offline banner
  if (!isOnline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-3"
        style={{ backgroundColor: branding.colors.warning }}
      >
        <div className="flex items-center justify-center gap-2 text-white">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Du er offline</span>
          <span className="hidden sm:inline">- nogle funktioner kan være begrænsede</span>
        </div>
      </div>
    );
  }

  // Show reconnected notification
  if (wasOffline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 animate-fadeIn"
        style={{ backgroundColor: branding.colors.success }}
      >
        <div className="flex items-center justify-center gap-2 text-white">
          <Wifi className="w-5 h-5" />
          <span className="font-medium">Du er online igen!</span>
          <Check className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return null;
}
