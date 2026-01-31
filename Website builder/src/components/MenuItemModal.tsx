// OrderFlow PWA Generator - Menu Item Modal Component
import { useState } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MenuItem, RestaurantConfig, SelectedOption, SelectedAddon } from '@/types';

interface MenuItemModalProps {
  item: MenuItem;
  restaurant: RestaurantConfig;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, options: SelectedOption[], addons: SelectedAddon[], notes?: string) => void;
}

export function MenuItemModal({ item, restaurant, isOpen, onClose, onAddToCart }: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  const { branding } = restaurant;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateTotalPrice = () => {
    let total = item.price;

    // Add option price modifiers
    item.options?.forEach(option => {
      const selectedChoiceIds = selectedOptions[option.id] || [];
      selectedChoiceIds.forEach(choiceId => {
        const choice = option.choices.find(c => c.id === choiceId);
        if (choice) {
          total += choice.priceModifier;
        }
      });
    });

    // Add addon prices
    item.addons?.forEach(addon => {
      if (selectedAddons[addon.id]) {
        total += addon.price;
      }
    });

    return total * quantity;
  };

  const handleOptionChange = (optionId: string, choiceId: string, multiple: boolean) => {
    setSelectedOptions(prev => {
      if (multiple) {
        const current = prev[optionId] || [];
        if (current.includes(choiceId)) {
          return { ...prev, [optionId]: current.filter(id => id !== choiceId) };
        }
        return { ...prev, [optionId]: [...current, choiceId] };
      }
      return { ...prev, [optionId]: [choiceId] };
    });
  };

  const handleAddonChange = (addonId: string, checked: boolean) => {
    setSelectedAddons(prev => ({ ...prev, [addonId]: checked }));
  };

  const handleAddToCart = () => {
    const options: SelectedOption[] = item.options?.map(option => ({
      optionId: option.id,
      optionName: option.name,
      choices: (selectedOptions[option.id] || []).map(choiceId => {
        const choice = option.choices.find(c => c.id === choiceId);
        return {
          choiceId,
          choiceName: choice?.name || '',
          priceModifier: choice?.priceModifier || 0
        };
      })
    })) || [];

    const addons: SelectedAddon[] = item.addons?.filter(addon => selectedAddons[addon.id]).map(addon => ({
      addonId: addon.id,
      addonName: addon.name,
      price: addon.price
    })) || [];

    onAddToCart(item, quantity, options, addons, notes);
    onClose();
    
    // Reset state
    setQuantity(1);
    setSelectedOptions({});
    setSelectedAddons({});
    setNotes('');
  };

  const isValid = () => {
    // Check if all required options are selected
    return item.options?.every(option => {
      if (!option.required) return true;
      const selected = selectedOptions[option.id] || [];
      return selected.length > 0;
    }) ?? true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] p-0 overflow-hidden"
        style={{ backgroundColor: branding.colors.background }}
      >
        {/* Image */}
        <div className="relative aspect-video">
          <img 
            src={item.image || branding.logo.url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Header */}
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle 
                    className="text-2xl font-bold mb-2"
                    style={{ 
                      fontFamily: branding.fonts.heading,
                      color: branding.colors.text 
                    }}
                  >
                    {item.name}
                  </DialogTitle>
                  <p style={{ color: branding.colors.textMuted }}>
                    {item.description}
                  </p>
                </div>
                <span 
                  className="text-2xl font-bold whitespace-nowrap"
                  style={{ color: branding.colors.primary }}
                >
                  {formatPrice(item.price)}
                </span>
              </div>
            </DialogHeader>

            {/* Allergens */}
            {item.allergens.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" style={{ color: branding.colors.warning }} />
                  <span className="text-sm font-medium" style={{ color: branding.colors.text }}>
                    Allergener
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.allergens.map(allergen => (
                    <Badge 
                      key={allergen}
                      variant="outline"
                      style={{ borderColor: branding.colors.warning }}
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            {item.options?.map(option => (
              <div key={option.id} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h4 
                    className="font-semibold"
                    style={{ color: branding.colors.text }}
                  >
                    {option.name}
                  </h4>
                  {option.required && (
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: branding.colors.error, color: '#fff' }}
                    >
                      Påkrævet
                    </Badge>
                  )}
                </div>

                {option.multiple ? (
                  // Checkbox for multiple selection
                  <div className="space-y-2">
                    {option.choices.map(choice => (
                      <div 
                        key={choice.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{ borderColor: `${branding.colors.text}15` }}
                        onClick={() => handleOptionChange(option.id, choice.id, true)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={(selectedOptions[option.id] || []).includes(choice.id)}
                            onCheckedChange={() => handleOptionChange(option.id, choice.id, true)}
                          />
                          <span style={{ color: branding.colors.text }}>{choice.name}</span>
                        </div>
                        {choice.priceModifier > 0 && (
                          <span style={{ color: branding.colors.textMuted }}>
                            +{formatPrice(choice.priceModifier)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Radio for single selection
                  <RadioGroup
                    value={selectedOptions[option.id]?.[0] || ''}
                    onValueChange={(value) => handleOptionChange(option.id, value, false)}
                  >
                    <div className="space-y-2">
                      {option.choices.map(choice => (
                        <div 
                          key={choice.id}
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                          style={{ borderColor: `${branding.colors.text}15` }}
                          onClick={() => handleOptionChange(option.id, choice.id, false)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={choice.id} id={choice.id} />
                            <Label htmlFor={choice.id} style={{ color: branding.colors.text }}>
                              {choice.name}
                            </Label>
                          </div>
                          {choice.priceModifier > 0 && (
                            <span style={{ color: branding.colors.textMuted }}>
                              +{formatPrice(choice.priceModifier)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </div>
            ))}

            {/* Addons */}
            {item.addons && item.addons.length > 0 && (
              <div className="mb-6">
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: branding.colors.text }}
                >
                  Tilføjelser
                </h4>
                <div className="space-y-2">
                  {item.addons.map(addon => (
                    <div 
                      key={addon.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: `${branding.colors.text}15` }}
                      onClick={() => handleAddonChange(addon.id, !selectedAddons[addon.id])}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedAddons[addon.id] || false}
                          onCheckedChange={(checked) => handleAddonChange(addon.id, checked as boolean)}
                        />
                        <span style={{ color: branding.colors.text }}>{addon.name}</span>
                      </div>
                      <span style={{ color: branding.colors.textMuted }}>
                        +{formatPrice(addon.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <Label 
                htmlFor="notes"
                className="font-semibold mb-2 block"
                style={{ color: branding.colors.text }}
              >
                Kommentarer
              </Label>
              <Textarea
                id="notes"
                placeholder="F.eks. uden løg, ekstra varm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4">
              {/* Quantity Selector */}
              <div 
                className="flex items-center gap-3 p-2 rounded-lg"
                style={{ backgroundColor: branding.colors.surface }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span 
                  className="font-semibold w-8 text-center"
                  style={{ color: branding.colors.text }}
                >
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Add Button */}
              <Button
                className="flex-1 py-6 text-lg font-semibold"
                disabled={!isValid()}
                onClick={handleAddToCart}
                style={{ 
                  backgroundColor: isValid() ? branding.colors.primary : '#ccc',
                  color: '#fff'
                }}
              >
                Tilføj til kurv
                <span className="ml-2">{formatPrice(calculateTotalPrice())}</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
