// OrderFlow PWA Generator - Hero Component
import { ArrowRight, Clock, Star, Truck, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RestaurantConfig } from '@/types';

interface HeroProps {
  restaurant: RestaurantConfig | null;
  isOpen: boolean;
  nextOpeningTime: string;
  onOrderClick: () => void;
}

export function Hero({ restaurant, isOpen, nextOpeningTime, onOrderClick }: HeroProps) {
  if (!restaurant) return null;

  const { branding, features } = restaurant;

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&h=1080&fit=crop"
          alt="Restaurant background"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.primary}ee 0%, ${branding.colors.primary}99 40%, transparent 100%)`
          }}
        />
        {/* Bottom fade for smooth transition */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: `linear-gradient(to top, ${branding.colors.background}, transparent)`
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          {/* Status Badge */}
          <div className="mb-6">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className="px-4 py-2.5 text-sm font-medium backdrop-blur-sm"
              style={{ 
                backgroundColor: isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(250,173,20,0.9)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              {isOpen ? 'Åben nu' : `Åbner ${nextOpeningTime}`}
            </Badge>
          </div>

          {/* Restaurant Name */}
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white leading-tight drop-shadow-lg"
            style={{ fontFamily: branding.fonts.heading }}
          >
            {branding.name}
          </h1>

          {/* Slogan */}
          {branding.slogan && (
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-light">
              {branding.slogan}
            </p>
          )}

          {/* Description */}
          <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
            {branding.description || 'Bestil lækker mad direkte fra vores app. Hurtig levering eller afhentning.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            {features.ordering && (
              <Button 
                size="lg"
                className="text-lg px-8 py-6 bg-white hover:bg-white/90 text-gray-900 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                onClick={onOrderClick}
              >
                Bestil nu
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            <Button 
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 border-white text-white bg-transparent hover:bg-white/20 font-semibold backdrop-blur-sm transition-all duration-300"
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Se menu
            </Button>
          </div>

          {/* Features Pills */}
          <div className="flex flex-wrap gap-3">
            {features.delivery && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20">
                <Truck className="w-4 h-4" />
                <span className="text-sm font-medium">Levering</span>
              </div>
            )}
            {features.pickup && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Afhentning</span>
              </div>
            )}
            {features.loyalty && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Loyalty program</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/60" />
      </div>
    </section>
  );
}
