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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border"
      style={{ borderColor: `${branding.colors.text}10` }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={item.image || branding.logo.url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {item.isPopular && (
            <Badge 
              className="flex items-center gap-1"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <Flame className="w-3 h-3" />
              Populær
            </Badge>
          )}
          {item.isNew && (
            <Badge 
              className="flex items-center gap-1"
              style={{ backgroundColor: branding.colors.accent }}
            >
              <Sparkles className="w-3 h-3" />
              Ny
            </Badge>
          )}
          {!item.isAvailable && (
            <Badge variant="secondary" className="bg-gray-500 text-white">
              Udsolgt
            </Badge>
          )}
        </div>

        {/* Quantity Badge */}
        {quantityInCart > 0 && (
          <div 
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: branding.colors.success }}
          >
            {quantityInCart}
          </div>
        )}

        {/* Overlay on hover */}
        <div 
          className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 
            className="font-semibold text-lg leading-tight line-clamp-2"
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
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${branding.colors.primary}15`,
                  color: branding.colors.primary 
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Add Button */}
        <Button
          className="w-full"
          size="sm"
          disabled={!item.isAvailable}
          style={{ 
            backgroundColor: item.isAvailable ? branding.colors.primary : '#ccc',
            color: '#fff'
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {item.isAvailable ? 'Tilføj' : 'Udsolgt'}
        </Button>
      </div>
    </div>
  );
}
