// OrderFlow PWA Generator - Hero Component
import { ArrowRight, Clock, Star, Truck } from 'lucide-react';
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
    <section 
      className="relative overflow-hidden"
      style={{ backgroundColor: branding.colors.secondary }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${branding.colors.primary} 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, ${branding.colors.accent} 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Status Badge */}
            <div className="mb-6">
              <Badge 
                variant={isOpen ? "default" : "secondary"}
                className="px-4 py-2 text-sm font-medium"
                style={{ 
                  backgroundColor: isOpen ? branding.colors.success : branding.colors.warning,
                  color: '#fff'
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                {isOpen ? 'Åben nu' : `Åbner ${nextOpeningTime}`}
              </Badge>
            </div>

            {/* Title */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              style={{ 
                fontFamily: branding.fonts.heading,
                color: branding.colors.text 
              }}
            >
              {branding.slogan || `Velkommen til ${branding.name}`}
            </h1>

            {/* Description */}
            <p 
              className="text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0"
              style={{ color: branding.colors.textMuted }}
            >
              {branding.description || 'Bestil lækker mad direkte fra vores app. Hurtig levering eller afhentning.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {features.ordering && (
                <Button 
                  size="lg"
                  className="text-lg px-8 py-6"
                  style={{ 
                    backgroundColor: branding.colors.primary,
                    color: '#fff'
                  }}
                  onClick={onOrderClick}
                >
                  Bestil nu
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              <Button 
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
                style={{ 
                  borderColor: branding.colors.primary,
                  color: branding.colors.primary
                }}
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Se menu
              </Button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
              {features.delivery && (
                <div 
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: `${branding.colors.primary}15` }}
                >
                  <Truck className="w-4 h-4" style={{ color: branding.colors.primary }} />
                  <span className="text-sm font-medium" style={{ color: branding.colors.text }}>
                    Levering
                  </span>
                </div>
              )}
              {features.pickup && (
                <div 
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: `${branding.colors.primary}15` }}
                >
                  <Clock className="w-4 h-4" style={{ color: branding.colors.primary }} />
                  <span className="text-sm font-medium" style={{ color: branding.colors.text }}>
                    Hurtig afhentning
                  </span>
                </div>
              )}
              {features.loyalty && (
                <div 
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: `${branding.colors.primary}15` }}
                >
                  <Star className="w-4 h-4" style={{ color: branding.colors.primary }} />
                  <span className="text-sm font-medium" style={{ color: branding.colors.text }}>
                    Loyalty program
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div 
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: '4/3' }}
            >
              <img 
                src={restaurant.menu.categories[0]?.image || branding.logo.url}
                alt={branding.name}
                className="w-full h-full object-cover"
              />
              {/* Overlay Gradient */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.primary}20 0%, transparent 50%)`
                }}
              />
            </div>

            {/* Floating Card */}
            <div 
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 max-w-[200px]"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${branding.colors.success}20` }}
                >
                  <Star className="w-6 h-6" style={{ color: branding.colors.success }} />
                </div>
                <div>
                  <p className="font-bold text-lg" style={{ color: branding.colors.text }}>4.8</p>
                  <p className="text-sm" style={{ color: branding.colors.textMuted }}>Baseret på 200+ anmeldelser</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
