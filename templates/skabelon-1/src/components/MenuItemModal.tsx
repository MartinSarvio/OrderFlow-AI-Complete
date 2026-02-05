// OrderFlow PWA Generator - Menu Item Modal Component
import { useState, useEffect } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

  // Reset state when modal opens with new item
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedOptions({});
      setSelectedAddons({});
      setNotes('');
    }
  }, [isOpen, item.id]);

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

  const handleSingleOptionChange = (optionId: string, choiceId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: [choiceId]
    }));
  };

  const handleMultipleOptionChange = (optionId: string, choiceId: string) => {
    setSelectedOptions(prev => {
      const current = prev[optionId] || [];
      if (current.includes(choiceId)) {
        return { ...prev, [optionId]: current.filter(id => id !== choiceId) };
      }
      return { ...prev, [optionId]: [...current, choiceId] };
    });
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  const handleAddToCart = () => {
    try {
      // Build options array
      const options: SelectedOption[] = [];
      
      item.options?.forEach(option => {
        const selectedChoiceIds = selectedOptions[option.id] || [];
        if (selectedChoiceIds.length > 0) {
          options.push({
            optionId: option.id,
            optionName: option.name,
            choices: selectedChoiceIds.map(choiceId => {
              const choice = option.choices.find(c => c.id === choiceId);
              return {
                choiceId,
                choiceName: choice?.name || '',
                priceModifier: choice?.priceModifier || 0
              };
            })
          });
        }
      });

      // Build addons array
      const addons: SelectedAddon[] = [];
      item.addons?.forEach(addon => {
        if (selectedAddons[addon.id]) {
          addons.push({
            addonId: addon.id,
            addonName: addon.name,
            price: addon.price
          });
        }
      });

      // Call parent handler
      onAddToCart(item, quantity, options, addons, notes);
      
      // Close modal
      onClose();
      
      // Reset state
      setQuantity(1);
      setSelectedOptions({});
      setSelectedAddons({});
      setNotes('');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const isValid = () => {
    // Check if all required options are selected
    if (!item.options) return true;
    
    for (const option of item.options) {
      if (option.required) {
        const selected = selectedOptions[option.id] || [];
        if (selected.length === 0) {
          return false;
        }
      }
    }
    return true;
  };

  const isOptionSelected = (optionId: string, choiceId: string) => {
    return (selectedOptions[optionId] || []).includes(choiceId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] p-0 overflow-hidden border-0"
        style={{ backgroundColor: branding.colors.background }}
      >
        {/* Image */}
        <div className="relative aspect-video flex-shrink-0">
          <img 
            src={item.image || branding.logo.url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Header */}
          <DialogHeader className="mb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
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
                    className="border-orange-300 text-orange-600"
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
                    className="text-xs"
                    style={{ backgroundColor: branding.colors.error, color: '#fff' }}
                  >
                    Påkrævet
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {option.choices.map(choice => {
                  const isSelected = isOptionSelected(option.id, choice.id);
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => option.multiple 
                        ? handleMultipleOptionChange(option.id, choice.id)
                        : handleSingleOptionChange(option.id, choice.id)
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left ${
                        isSelected 
                          ? 'border-2' 
                          : 'border hover:bg-gray-50'
                      }`}
                      style={{ 
                        borderColor: isSelected ? branding.colors.primary : `${branding.colors.text}15`,
                        backgroundColor: isSelected ? `${branding.colors.primary}08` : 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom Radio/Checkbox Indicator */}
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'border-white' 
                              : 'border-gray-300'
                          }`}
                          style={{
                            borderRadius: option.multiple ? '4px' : '50%',
                            backgroundColor: isSelected ? branding.colors.primary : 'transparent',
                            borderColor: isSelected ? branding.colors.primary : '#d1d5db'
                          }}
                        >
                          {isSelected && (
                            option.multiple ? (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )
                          )}
                        </div>
                        <span style={{ color: branding.colors.text }}>{choice.name}</span>
                      </div>
                      {choice.priceModifier > 0 && (
                        <span style={{ color: branding.colors.textMuted }}>
                          +{formatPrice(choice.priceModifier)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
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
                {item.addons.map(addon => {
                  const isSelected = selectedAddons[addon.id] || false;
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => handleAddonToggle(addon.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left ${
                        isSelected 
                          ? 'border-2' 
                          : 'border hover:bg-gray-50'
                      }`}
                      style={{ 
                        borderColor: isSelected ? branding.colors.primary : `${branding.colors.text}15`,
                        backgroundColor: isSelected ? `${branding.colors.primary}08` : 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom Checkbox Indicator */}
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: isSelected ? branding.colors.primary : 'transparent',
                            border: `2px solid ${isSelected ? branding.colors.primary : '#d1d5db'}`
                          }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span style={{ color: branding.colors.text }}>{addon.name}</span>
                      </div>
                      <span style={{ color: branding.colors.textMuted }}>
                        +{formatPrice(addon.price)}
                      </span>
                    </button>
                  );
                })}
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
              className="resize-none rounded-xl"
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div 
              className="flex items-center gap-2 p-2 rounded-xl"
              style={{ backgroundColor: branding.colors.surface }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span 
                className="font-semibold w-10 text-center text-lg"
                style={{ color: branding.colors.text }}
              >
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Add Button */}
            <Button
              className="flex-1 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
      </DialogContent>
    </Dialog>
  );
}
