// OrderFlow PWA Generator - Cart Drawer Component
// CartDrawer component
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
        <SheetHeader className="p-4 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
          <div className="flex items-center justify-between">
            <SheetTitle 
              className="text-xl font-bold flex items-center gap-2"
              style={{ fontFamily: branding.fonts.heading }}
            >
              <ShoppingBag className="w-5 h-5" />
              Din kurv
              {cart.items.length > 0 && (
                <Badge style={{ backgroundColor: branding.colors.primary }}>
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${branding.colors.primary}15` }}
            >
              <ShoppingBag 
                className="w-10 h-10" 
                style={{ color: branding.colors.primary }} 
              />
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: branding.colors.text }}
            >
              Din kurv er tom
            </h3>
            <p style={{ color: branding.colors.textMuted }}>
              Tilføj nogle lækre retter fra menuen
            </p>
            <Button
              className="mt-6"
              onClick={onClose}
              style={{ backgroundColor: branding.colors.primary, color: '#fff' }}
            >
              Se menu
            </Button>
          </div>
        ) : (
          <>
            {/* Order Type Selection */}
            <div className="p-4 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
              <Label className="text-sm font-medium mb-3 block" style={{ color: branding.colors.text }}>
                Bestillingstype
              </Label>
              <RadioGroup 
                value={cart.type} 
                onValueChange={(value) => onSetOrderType(value as 'delivery' | 'pickup' | 'table')}
                className="flex gap-2"
              >
                {features.delivery && (
                  <div>
                    <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                    <Label
                      htmlFor="delivery"
                      className="flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      style={{ 
                        borderColor: cart.type === 'delivery' ? branding.colors.primary : `${branding.colors.text}20`,
                        backgroundColor: cart.type === 'delivery' ? `${branding.colors.primary}10` : 'transparent'
                      }}
                    >
                      <MapPin className="w-5 h-5 mb-1" style={{ color: branding.colors.primary }} />
                      <span className="text-sm font-medium">Levering</span>
                    </Label>
                  </div>
                )}
                {features.pickup && (
                  <div>
                    <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                    <Label
                      htmlFor="pickup"
                      className="flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      style={{ 
                        borderColor: cart.type === 'pickup' ? branding.colors.primary : `${branding.colors.text}20`,
                        backgroundColor: cart.type === 'pickup' ? `${branding.colors.primary}10` : 'transparent'
                      }}
                    >
                      <Clock className="w-5 h-5 mb-1" style={{ color: branding.colors.primary }} />
                      <span className="text-sm font-medium">Afhentning</span>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {cart.items.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-xl border"
                  style={{ borderColor: `${branding.colors.text}10` }}
                >
                  <div className="flex items-start gap-3">
                    <img 
                      src={item.menuItem.image || branding.logo.url}
                      alt={item.menuItem.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 
                          className="font-semibold truncate"
                          style={{ color: branding.colors.text }}
                        >
                          {item.menuItem.name}
                        </h4>
                        <span 
                          className="font-semibold whitespace-nowrap"
                          style={{ color: branding.colors.primary }}
                        >
                          {formatPrice(getItemPrice(item))}
                        </span>
                      </div>

                      {/* Item Details */}
                      {formatItemDetails(item).length > 0 && (
                        <div className="mt-1 space-y-0.5">
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
                      <div className="flex items-center justify-between mt-3">
                        <div 
                          className="flex items-center gap-2"
                          style={{ backgroundColor: branding.colors.surface }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span 
                            className="font-medium w-6 text-center text-sm"
                            style={{ color: branding.colors.text }}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
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
              <div>
                <Label 
                  className="text-sm font-medium mb-2 block"
                  style={{ color: branding.colors.text }}
                >
                  Kommentarer til bestillingen
                </Label>
                <Textarea
                  placeholder="F.eks. ring på dørklokken..."
                  value={cart.notes || ''}
                  onChange={(e) => onSetNotes(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Footer - Totals */}
            <div 
              className="p-4 border-t"
              style={{ 
                borderColor: `${branding.colors.text}10`,
                backgroundColor: branding.colors.surface 
              }}
            >
              <div className="space-y-2 mb-4">
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
                <Separator />
                <div 
                  className="flex justify-between text-lg font-bold"
                  style={{ color: branding.colors.text }}
                >
                  <span>Total</span>
                  <span style={{ color: branding.colors.primary }}>
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full py-6 text-lg font-semibold"
                onClick={onCheckout}
                style={{ backgroundColor: branding.colors.primary, color: '#fff' }}
              >
                Gå til betaling
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>

              {cart.type === 'delivery' && totals.subtotal < 150 && (
                <div 
                  className="flex items-center gap-2 mt-3 text-sm"
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
