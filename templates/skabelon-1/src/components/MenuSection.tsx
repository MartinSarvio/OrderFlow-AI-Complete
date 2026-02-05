// OrderFlow PWA Generator - Menu Section Component
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Info, UtensilsCrossed, Truck, Gift, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RestaurantConfig, MenuItem, CartItem } from '@/types';
import { MenuItemCard } from './MenuItemCard';
import { MenuItemModal } from './MenuItemModal';

interface MenuSectionProps {
  restaurant: RestaurantConfig | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (item: MenuItem, quantity: number, options: any[], addons: any[], notes?: string) => void;
  cartItems: CartItem[];
}

export function MenuSection({ 
  restaurant, 
  searchQuery, 
  onSearchChange, 
  onAddToCart,
  cartItems 
}: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  if (!restaurant) return null;

  const { menu, branding, delivery, features } = restaurant;

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
  }, [menu.categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 250;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollPosition, 300);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setItemModalOpen(true);
  };

  const getItemQuantityInCart = (itemId: string) => {
    return cartItems
      .filter(item => item.menuItem.id === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredCategories = searchQuery
    ? menu.categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : menu.categories;

  return (
    <section id="menu" className="py-16 md:py-24" style={{ backgroundColor: branding.colors.background }}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: `${branding.colors.primary}15` }}
          >
            <UtensilsCrossed className="w-5 h-5" style={{ color: branding.colors.primary }} />
            <span 
              className="font-semibold text-sm"
              style={{ color: branding.colors.primary }}
            >
              Vores Menu
            </span>
          </div>
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              fontFamily: branding.fonts.heading,
              color: branding.colors.text 
            }}
          >
            Udforsk vores retter
          </h2>
          <p 
            className="text-lg max-w-2xl mx-auto mb-8"
            style={{ color: branding.colors.textMuted }}
          >
            Lækre retter lavet med friske ingredienser og masser af kærlighed
          </p>

          {/* Info Pills - Delivery, Extras, Gift Cards */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {features.delivery && delivery && (
              <div 
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
                style={{ backgroundColor: `${branding.colors.primary}10` }}
              >
                <Truck className="w-4 h-4" style={{ color: branding.colors.primary }} />
                <span style={{ color: branding.colors.text }}>
                  Levering fra {delivery.fee} kr
                </span>
                {delivery.freeDeliveryThreshold && (
                  <span style={{ color: branding.colors.textMuted }}>
                    · Gratis over {delivery.freeDeliveryThreshold} kr
                  </span>
                )}
              </div>
            )}
            <div 
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm cursor-pointer hover:shadow-md transition-all"
              style={{ backgroundColor: '#f0fdf4' }}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Tilbehør & Drikkevarer</span>
            </div>
            <div 
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm cursor-pointer hover:shadow-md transition-all"
              style={{ backgroundColor: '#fef3c7' }}
            >
              <Gift className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700">Gavekort</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative group">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
              style={{ color: branding.colors.textMuted }}
            />
            <Input
              type="text"
              placeholder="Søg efter retter..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 py-5 text-base rounded-xl border-2 transition-all duration-300 focus:shadow-lg"
              style={{ 
                borderColor: `${branding.colors.primary}20`,
              }}
            />
          </div>
        </div>

        {/* Category Navigation */}
        {!searchQuery && (
          <div className="relative mb-12 px-12">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-10 h-10 rounded-full shadow-lg bg-white hover:bg-gray-50 items-center justify-center transition-all hover:scale-110"
                onClick={() => scrollCategories('left')}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div 
              ref={categoryScrollRef}
              onScroll={checkScrollPosition}
              className="flex gap-2 overflow-x-auto scrollbar-hide py-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium transition-all duration-300 hover:shadow-md flex-shrink-0"
                style={selectedCategory === null ? {
                  backgroundColor: branding.colors.primary,
                  color: '#fff'
                } : {
                  borderColor: `${branding.colors.primary}40`,
                  color: branding.colors.text,
                  backgroundColor: 'transparent'
                }}
              >
                Alle retter
              </Button>
              {menu.categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium transition-all duration-300 hover:shadow-md flex-shrink-0"
                  style={selectedCategory === category.id ? {
                    backgroundColor: branding.colors.primary,
                    color: '#fff'
                  } : {
                    borderColor: `${branding.colors.primary}40`,
                    color: branding.colors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-10 h-10 rounded-full shadow-lg bg-white hover:bg-gray-50 items-center justify-center transition-all hover:scale-110"
                onClick={() => scrollCategories('right')}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-16">
          {filteredCategories
            .filter(cat => selectedCategory === null || cat.id === selectedCategory)
            .map(category => (
              <div key={category.id}>
                {/* Category Header - Modern Design */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-3">
                    {category.image && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 
                        className="text-2xl md:text-3xl font-bold"
                        style={{ 
                          fontFamily: branding.fonts.heading,
                          color: branding.colors.text 
                        }}
                      >
                        {category.name}
                      </h3>
                      {category.description && (
                        <p 
                          className="text-base mt-1"
                          style={{ color: branding.colors.textMuted }}
                        >
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Decorative line */}
                  <div 
                    className="h-1 w-24 rounded-full"
                    style={{ backgroundColor: branding.colors.primary }}
                  />
                </div>

                {/* Items Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.items.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      branding={branding}
                      quantityInCart={getItemQuantityInCart(item.id)}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${branding.colors.primary}15` }}
            >
              <Info 
                className="w-10 h-10"
                style={{ color: branding.colors.primary }}
              />
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: branding.colors.text }}
            >
              Ingen resultater fundet
            </h3>
            <p style={{ color: branding.colors.textMuted }}>
              Prøv at søge efter noget andet
            </p>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          restaurant={restaurant}
          isOpen={itemModalOpen}
          onClose={() => {
            setItemModalOpen(false);
            setSelectedItem(null);
          }}
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
}
