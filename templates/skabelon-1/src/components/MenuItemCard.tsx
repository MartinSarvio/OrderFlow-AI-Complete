// OrderFlow PWA Generator - Menu Item Card Component
import { Plus, Flame, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MenuItem, BrandingConfig } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
  branding: BrandingConfig;
  quantityInCart: number;
  onClick: () => void;
}

export function MenuItemCard({ item, branding, quantityInCart, onClick }: MenuItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={item.image || branding.logo.url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {item.isPopular && (
            <Badge 
              className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              <Flame className="w-3 h-3" />
              Populær
            </Badge>
          )}
          {item.isNew && (
            <Badge 
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            >
              <Sparkles className="w-3 h-3" />
              Ny
            </Badge>
          )}
          {!item.isAvailable && (
            <Badge className="bg-gray-500 text-white border-0">
              Udsolgt
            </Badge>
          )}
        </div>

        {/* Quantity Badge */}
        {quantityInCart > 0 && (
          <div 
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ backgroundColor: branding.colors.primary }}
          >
            {quantityInCart}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 
            className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors"
            style={{ color: branding.colors.text }}
          >
            {item.name}
          </h4>
          <span 
            className="font-bold text-lg whitespace-nowrap"
            style={{ color: branding.colors.primary }}
          >
            {formatPrice(item.price)}
          </span>
        </div>

        <p 
          className="text-sm line-clamp-2 mb-3"
          style={{ color: branding.colors.textMuted }}
        >
          {item.description}
        </p>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Add Button */}
        <Button
          className="w-full group/btn relative overflow-hidden"
          size="sm"
          disabled={!item.isAvailable}
          style={{ 
            backgroundColor: item.isAvailable ? branding.colors.primary : '#ccc',
            color: '#fff'
          }}
        >
          <span className="relative z-10 flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform duration-200" />
            {item.isAvailable ? 'Tilføj til kurv' : 'Udsolgt'}
          </span>
          {/* Hover effect */}
          <span 
            className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
          />
        </Button>
      </div>
    </div>
  );
}
