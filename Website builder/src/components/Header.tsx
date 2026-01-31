// OrderFlow PWA Generator - Header Component
import { useState } from 'react';
import { ShoppingCart, User, Menu, Clock, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { RestaurantConfig } from '@/types';

interface HeaderProps {
  restaurant: RestaurantConfig | null;
  itemCount: number;
  onCartClick: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function Header({ restaurant, itemCount, onCartClick, onNavigate, currentView }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!restaurant) return null;

  const navItems = [
    { id: 'home', label: 'Forside' },
    { id: 'menu', label: 'Menu' },
    { id: 'about', label: 'Om os' },
    { id: 'contact', label: 'Kontakt' }
  ];

  const isActive = (view: string) => currentView === view;

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top Bar */}
      <div 
        className="hidden md:flex items-center justify-center gap-6 py-2 px-4 text-sm"
        style={{ backgroundColor: restaurant.branding.colors.primary }}
      >
        <div className="flex items-center gap-2 text-white/90">
          <Clock className="w-4 h-4" />
          <span>Åben i dag: {restaurant.businessHours.monday.open} - {restaurant.businessHours.monday.close}</span>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <MapPin className="w-4 h-4" />
          <span>{restaurant.contact.address}, {restaurant.contact.city}</span>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <Phone className="w-4 h-4" />
          <span>{restaurant.contact.phone}</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img 
            src={restaurant.branding.logo.url} 
            alt={restaurant.branding.name}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
          />
          <div className="hidden sm:block text-left">
            <h1 
              className="font-bold text-lg md:text-xl"
              style={{ 
                fontFamily: restaurant.branding.fonts.heading,
                color: restaurant.branding.colors.text 
              }}
            >
              {restaurant.branding.name}
            </h1>
            <p 
              className="text-xs"
              style={{ color: restaurant.branding.colors.textMuted }}
            >
              {restaurant.branding.slogan}
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={{
                color: isActive(item.id) ? restaurant.branding.colors.primary : restaurant.branding.colors.text,
                backgroundColor: isActive(item.id) ? `${restaurant.branding.colors.primary}15` : 'transparent'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
            style={{ color: restaurant.branding.colors.text }}
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                style={{ backgroundColor: restaurant.branding.colors.primary }}
              >
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* Profile Button (Desktop) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => onNavigate('profile')}
            style={{ color: restaurant.branding.colors.text }}
          >
            <User className="w-5 h-5" />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                style={{ color: restaurant.branding.colors.text }}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] p-0"
              style={{ backgroundColor: restaurant.branding.colors.background }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div 
                  className="flex items-center justify-between p-4 border-b"
                  style={{ borderColor: `${restaurant.branding.colors.text}15` }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={restaurant.branding.logo.url} 
                      alt={restaurant.branding.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span 
                      className="font-bold"
                      style={{ color: restaurant.branding.colors.text }}
                    >
                      {restaurant.branding.shortName}
                    </span>
                  </div>
                </div>

                {/* Mobile Nav Items */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    {navItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg font-medium transition-all"
                        style={{
                          color: isActive(item.id) ? restaurant.branding.colors.primary : restaurant.branding.colors.text,
                          backgroundColor: isActive(item.id) ? `${restaurant.branding.colors.primary}15` : 'transparent'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg font-medium transition-all"
                      style={{
                        color: isActive('profile') ? restaurant.branding.colors.primary : restaurant.branding.colors.text,
                        backgroundColor: isActive('profile') ? `${restaurant.branding.colors.primary}15` : 'transparent'
                      }}
                    >
                      Min profil
                    </button>
                  </div>
                </nav>

                {/* Mobile Contact Info */}
                <div 
                  className="p-4 border-t space-y-3"
                  style={{ borderColor: `${restaurant.branding.colors.text}15` }}
                >
                  <div className="flex items-center gap-3 text-sm" style={{ color: restaurant.branding.colors.textMuted }}>
                    <Phone className="w-4 h-4" />
                    <span>{restaurant.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: restaurant.branding.colors.textMuted }}>
                    <MapPin className="w-4 h-4" />
                    <span>{restaurant.contact.address}</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
