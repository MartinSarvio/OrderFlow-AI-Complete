// OrderFlow PWA Generator - Menu Section Component
import { useState, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Info } from 'lucide-react';
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
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  if (!restaurant) return null;

  const { menu, branding } = restaurant;

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
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
    <section id="menu" className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ 
              fontFamily: branding.fonts.heading,
              color: branding.colors.text 
            }}
          >
            Vores Menu
          </h2>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: branding.colors.textMuted }}
          >
            Udforsk vores lækre udvalg af retter lavet med friske ingredienser
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: branding.colors.textMuted }}
            />
            <Input
              type="text"
              placeholder="Søg efter retter..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 py-6 text-lg"
              style={{ 
                borderColor: `${branding.colors.primary}30`,
                borderRadius: '9999px'
              }}
            />
          </div>
        </div>

        {/* Category Navigation */}
        {!searchQuery && (
          <div className="relative mb-10">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
              onClick={() => scrollCategories('left')}
              style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div 
              ref={categoryScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="whitespace-nowrap rounded-full px-6"
                style={selectedCategory === null ? {
                  backgroundColor: branding.colors.primary,
                  color: '#fff'
                } : {
                  borderColor: branding.colors.primary,
                  color: branding.colors.primary
                }}
              >
                Alle retter
              </Button>
              {menu.categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap rounded-full px-6"
                  style={selectedCategory === category.id ? {
                    backgroundColor: branding.colors.primary,
                    color: '#fff'
                  } : {
                    borderColor: branding.colors.primary,
                    color: branding.colors.primary
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
              onClick={() => scrollCategories('right')}
              style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-12">
          {filteredCategories
            .filter(cat => selectedCategory === null || cat.id === selectedCategory)
            .map(category => (
              <div key={category.id}>
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-6">
                  <h3 
                    className="text-2xl font-bold"
                    style={{ 
                      fontFamily: branding.fonts.heading,
                      color: branding.colors.text 
                    }}
                  >
                    {category.name}
                  </h3>
                  <div 
                    className="flex-1 h-px"
                    style={{ backgroundColor: `${branding.colors.text}15` }}
                  />
                  {category.description && (
                    <p style={{ color: branding.colors.textMuted }}>
                      {category.description}
                    </p>
                  )}
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
          <div className="text-center py-12">
            <Info 
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: branding.colors.textMuted }}
            />
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
