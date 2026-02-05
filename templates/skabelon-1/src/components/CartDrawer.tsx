// OrderFlow PWA Generator - Cart Drawer Component
import { Plus, Minus, MapPin, Clock, ShoppingBag, Trash2, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RestaurantConfig, Cart, CartItem } from '@/types';

interface CartDrawerProps {
  restaurant: RestaurantConfig | null;
  cart: Cart;
  totals: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    tip: number;
    total: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSetOrderType: (type: 'delivery' | 'pickup' | 'table') => void;
  onSetNotes: (notes: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  restaurant,
  cart,
  totals,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onSetOrderType,
  onSetNotes,
  onCheckout
}: CartDrawerProps) {
  if (!restaurant) return null;

  const { branding, features } = restaurant;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatItemDetails = (item: CartItem) => {
    const details: string[] = [];
    
    item.options.forEach(option => {
      const choices = option.choices.map(c => c.choiceName).join(', ');
      details.push(`${option.optionName}: ${choices}`);
    });

    item.addons.forEach(addon => {
      details.push(`+ ${addon.addonName}`);
    });

    if (item.notes) {
      details.push(`Note: ${item.notes}`);
    }

    return details;
  };

  const getItemPrice = (item: CartItem) => {
    let price = item.menuItem.price;
    item.options.forEach(option => {
      option.choices.forEach(choice => {
        price += choice.priceModifier;
      });
    });
    item.addons.forEach(addon => {
      price += addon.price;
    });
    return price * item.quantity;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col"
        style={{ backgroundColor: branding.colors.background }}
      >
        <SheetHeader className="p-5 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
          <div className="flex items-center justify-between">
            <SheetTitle 
              className="text-xl font-bold flex items-center gap-3"
              style={{ fontFamily: branding.fonts.heading }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${branding.colors.primary}15` }}
              >
                <ShoppingBag className="w-5 h-5" style={{ color: branding.colors.primary }} />
              </div>
              Din kurv
              {cart.items.length > 0 && (
                <Badge 
                  className="ml-2"
                  style={{ backgroundColor: branding.colors.primary }}
                >
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${branding.colors.primary}10` }}
            >
              <ShoppingBag 
                className="w-12 h-12" 
                style={{ color: branding.colors.primary }} 
              />
            </div>
            <h3 
              className="text-2xl font-semibold mb-3"
              style={{ color: branding.colors.text }}
            >
              Din kurv er tom
            </h3>
            <p className="mb-8" style={{ color: branding.colors.textMuted }}>
              Tilføj nogle lækre retter fra menuen
            </p>
            <Button
              className="px-8 py-5 text-lg font-medium rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105"
              onClick={onClose}
              style={{ backgroundColor: branding.colors.primary, color: '#fff' }}
            >
              Se menu
            </Button>
          </div>
        ) : (
          <>
            {/* Order Type Selection */}
            <div className="p-5 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
              <Label className="text-sm font-semibold mb-4 block" style={{ color: branding.colors.text }}>
                Vælg bestillingstype
              </Label>
              <RadioGroup 
                value={cart.type} 
                onValueChange={(value) => onSetOrderType(value as 'delivery' | 'pickup' | 'table')}
                className="flex gap-3"
              >
                {features.delivery && (
                  <div className="flex-1">
                    <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                    <Label
                      htmlFor="delivery"
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      style={{ 
                        borderColor: cart.type === 'delivery' ? branding.colors.primary : '#e5e5e5',
                        backgroundColor: cart.type === 'delivery' ? `${branding.colors.primary}08` : 'transparent'
                      }}
                    >
                      <MapPin className="w-6 h-6 mb-2" style={{ color: branding.colors.primary }} />
                      <span className="text-sm font-medium">Levering</span>
                    </Label>
                  </div>
                )}
                {features.pickup && (
                  <div className="flex-1">
                    <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                    <Label
                      htmlFor="pickup"
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      style={{ 
                        borderColor: cart.type === 'pickup' ? branding.colors.primary : '#e5e5e5',
                        backgroundColor: cart.type === 'pickup' ? `${branding.colors.primary}08` : 'transparent'
                      }}
                    >
                      <Clock className="w-6 h-6 mb-2" style={{ color: branding.colors.primary }} />
                      <span className="text-sm font-medium">Afhentning</span>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-5 space-y-4">
              {cart.items.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.menuItem.image || branding.logo.url}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 
                          className="font-semibold truncate"
                          style={{ color: branding.colors.text }}
                        >
                          {item.menuItem.name}
                        </h4>
                        <span 
                          className="font-bold whitespace-nowrap"
                          style={{ color: branding.colors.primary }}
                        >
                          {formatPrice(getItemPrice(item))}
                        </span>
                      </div>

                      {/* Item Details */}
                      {formatItemDetails(item).length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {formatItemDetails(item).map((detail, idx) => (
                            <p 
                              key={idx}
                              className="text-xs"
                              style={{ color: branding.colors.textMuted }}
                            >
                              {detail}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div 
                          className="flex items-center gap-1 p-1 rounded-lg"
                          style={{ backgroundColor: branding.colors.surface }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span 
                            className="font-semibold w-8 text-center text-sm"
                            style={{ color: branding.colors.text }}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="pt-4">
                <Label 
                  className="text-sm font-semibold mb-2 block"
                  style={{ color: branding.colors.text }}
                >
                  Kommentarer til bestillingen
                </Label>
                <Textarea
                  placeholder="F.eks. ring på dørklokken..."
                  value={cart.notes || ''}
                  onChange={(e) => onSetNotes(e.target.value)}
                  className="resize-none rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {/* Footer - Totals */}
            <div 
              className="p-5 border-t"
              style={{ 
                borderColor: `${branding.colors.text}10`,
                backgroundColor: branding.colors.surface 
              }}
            >
              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-sm" style={{ color: branding.colors.textMuted }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: branding.colors.textMuted }}>
                  <span>Moms (25%)</span>
                  <span>{formatPrice(totals.tax)}</span>
                </div>
                {cart.type === 'delivery' && (
                  <div className="flex justify-between text-sm" style={{ color: branding.colors.textMuted }}>
                    <span>Leveringsgebyr</span>
                    <span>{formatPrice(totals.deliveryFee)}</span>
                  </div>
                )}
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: branding.colors.success }}>
                    <span>Rabat</span>
                    <span>-{formatPrice(totals.discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div 
                  className="flex justify-between text-xl font-bold"
                  style={{ color: branding.colors.text }}
                >
                  <span>Total</span>
                  <span style={{ color: branding.colors.primary }}>
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                onClick={onCheckout}
                style={{ backgroundColor: branding.colors.primary, color: '#fff' }}
              >
                Gå til betaling
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>

              {cart.type === 'delivery' && totals.subtotal < 150 && (
                <div 
                  className="flex items-center gap-2 mt-4 text-sm"
                  style={{ color: branding.colors.warning }}
                >
                  <Info className="w-4 h-4" />
                  <span>Minimumsbestilling for levering: {formatPrice(150)}</span>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
