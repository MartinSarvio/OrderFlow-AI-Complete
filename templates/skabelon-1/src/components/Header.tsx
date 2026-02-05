// OrderFlow PWA Generator - Header Component
import { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for active section
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Determine active section based on scroll position
      const sections = ['home', 'menu', 'about', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            if (currentView !== section) {
              // Update URL hash without triggering navigation
              window.history.replaceState(null, '', `#${section}`);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  if (!restaurant) return null;

  const { branding } = restaurant;

  const navItems = [
    { id: 'home', label: 'Forside' },
    { id: 'menu', label: 'Menu' },
    { id: 'about', label: 'Om os' },
    { id: 'contact', label: 'Kontakt' }
  ];

  const isActive = (view: string) => currentView === view;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      {/* Top Bar - only show when scrolled */}
      <div 
        className={`hidden md:flex items-center justify-center gap-8 py-1.5 px-4 text-xs transition-all duration-300 ${
          scrolled ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden py-0'
        }`}
        style={{ backgroundColor: branding.colors.primary }}
      >
        <div className="flex items-center gap-2 text-white/90">
          <Clock className="w-3 h-3" />
          <span>Åben i dag: {restaurant.businessHours.monday.open} - {restaurant.businessHours.monday.close}</span>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <MapPin className="w-3 h-3" />
          <span>{restaurant.contact.address}, {restaurant.contact.city}</span>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <Phone className="w-3 h-3" />
          <span>{restaurant.contact.phone}</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-3">
        {/* Logo */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 group"
        >
          <div className="relative overflow-hidden rounded-full">
            <img 
              src={restaurant.branding.logo.url} 
              alt={restaurant.branding.name}
              className="w-9 h-9 md:w-10 md:h-10 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="hidden sm:block text-left">
            <h1 
              className={`font-bold text-base md:text-lg transition-colors duration-300 group-hover:opacity-80 ${
                scrolled ? '' : 'text-white drop-shadow-md'
              }`}
              style={{ 
                fontFamily: restaurant.branding.fonts.heading,
                color: scrolled ? restaurant.branding.colors.text : undefined
              }}
            >
              {restaurant.branding.name}
            </h1>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative px-4 py-2 text-sm font-medium transition-all duration-300 group"
            >
              <span 
                className={`transition-colors duration-300 ${
                  isActive(item.id) 
                    ? '' 
                    : scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
                }`}
                style={{
                  color: isActive(item.id) ? branding.colors.primary : undefined
                }}
              >
                {item.label}
              </span>
              {/* Active indicator - pill style */}
              <span 
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
                  isActive(item.id) ? 'w-6' : 'w-0 group-hover:w-4'
                }`}
                style={{ 
                  backgroundColor: isActive(item.id) ? branding.colors.primary : scrolled ? '#999' : 'rgba(255,255,255,0.5)'
                }}
              />
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`relative rounded-full transition-all duration-300 hover:scale-110 ${
              scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
            }`}
            onClick={onCartClick}
          >
            <ShoppingCart className={`w-5 h-5 ${scrolled ? '' : 'text-white'}`} style={{ color: scrolled ? branding.colors.text : undefined }} />
            {itemCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-in zoom-in"
                style={{ backgroundColor: branding.colors.primary }}
              >
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* Profile Button (Desktop) */}
          <Button
            variant="ghost"
            size="icon"
            className={`hidden md:flex rounded-full transition-all duration-300 hover:scale-110 ${
              scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
            }`}
            onClick={() => onNavigate('profile')}
          >
            <User className={`w-5 h-5 ${scrolled ? '' : 'text-white'}`} style={{ color: scrolled ? branding.colors.text : undefined }} />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`md:hidden rounded-full transition-all duration-300 ${
                  scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/20'
                }`}
              >
                <Menu className={`w-5 h-5 ${scrolled ? '' : 'text-white'}`} />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[300px] p-0"
              style={{ backgroundColor: restaurant.branding.colors.background }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div 
                  className="flex items-center justify-between p-5 border-b"
                  style={{ borderColor: `${restaurant.branding.colors.text}10` }}
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
                  <div className="space-y-1">
                    {navItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3.5 rounded-xl font-medium transition-all duration-300 hover:bg-gray-100"
                        style={{
                          color: isActive(item.id) ? branding.colors.primary : branding.colors.text,
                          backgroundColor: isActive(item.id) ? `${branding.colors.primary}10` : 'transparent'
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
                      className="w-full text-left px-4 py-3.5 rounded-xl font-medium transition-all duration-300 hover:bg-gray-100"
                      style={{
                        color: isActive('profile') ? branding.colors.primary : branding.colors.text,
                        backgroundColor: isActive('profile') ? `${branding.colors.primary}10` : 'transparent'
                      }}
                    >
                      Min profil
                    </button>
                  </div>
                </nav>

                {/* Mobile Contact Info */}
                <div 
                  className="p-5 border-t space-y-3"
                  style={{ borderColor: `${restaurant.branding.colors.text}10` }}
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
