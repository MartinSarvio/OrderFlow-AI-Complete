// OrderFlow PWA Generator - Cart Hook
import { useState, useCallback, useMemo } from 'react';
import type { Cart, CartItem, MenuItem, SelectedOption, SelectedAddon, DeliveryAddress } from '@/types';
import { emptyCart } from '@/data/mockData';

export function useCart() {
  const [cart, setCart] = useState<Cart>(emptyCart);

  const generateCartItemId = () => {
    return `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const calculateItemPrice = (
    menuItem: MenuItem,
    quantity: number,
    options: SelectedOption[],
    addons: SelectedAddon[]
  ): number => {
    let basePrice = menuItem.price;

    // Add option price modifiers
    options.forEach(option => {
      option.choices.forEach(choice => {
        basePrice += choice.priceModifier;
      });
    });

    // Add addon prices
    addons.forEach(addon => {
      basePrice += addon.price;
    });

    return basePrice * quantity;
  };

  const addToCart = useCallback((
    menuItem: MenuItem,
    quantity: number,
    options: SelectedOption[],
    addons: SelectedAddon[],
    notes?: string
  ) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(item =>
        item.menuItem.id === menuItem.id &&
        JSON.stringify(item.options) === JSON.stringify(options) &&
        JSON.stringify(item.addons) === JSON.stringify(addons) &&
        item.notes === notes
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return { ...prevCart, items: updatedItems };
      }

      // Add new item
      const newItem: CartItem = {
        id: generateCartItemId(),
        menuItem,
        quantity,
        options,
        addons,
        notes
      };

      return {
        ...prevCart,
        items: [...prevCart.items, newItem]
      };
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return {
          ...prevCart,
          items: prevCart.items.filter(item => item.id !== itemId)
        };
      }

      return {
        ...prevCart,
        items: prevCart.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.filter(item => item.id !== itemId)
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
  }, []);

  const setOrderType = useCallback((type: 'delivery' | 'pickup' | 'table') => {
    setCart(prevCart => ({ ...prevCart, type }));
  }, []);

  const setAddress = useCallback((address: DeliveryAddress | undefined) => {
    setCart(prevCart => ({ ...prevCart, address }));
  }, []);

  const setScheduledFor = useCallback((scheduledFor: string | undefined) => {
    setCart(prevCart => ({ ...prevCart, scheduledFor }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setCart(prevCart => ({ ...prevCart, notes }));
  }, []);

  const setTip = useCallback((tip: number) => {
    setCart(prevCart => ({ ...prevCart, tip }));
  }, []);

  const setLoyaltyDiscount = useCallback((discount: number) => {
    setCart(prevCart => ({ ...prevCart, loyaltyDiscount: discount }));
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.items.reduce((sum, item) => {
      const itemPrice = calculateItemPrice(
        item.menuItem,
        item.quantity,
        item.options,
        item.addons
      );
      return sum + itemPrice;
    }, 0);

    const tax = subtotal * 0.25; // 25% moms
    const deliveryFee = cart.type === 'delivery' ? 35 : 0; // Mock delivery fee
    const discount = cart.loyaltyDiscount || 0;
    const tip = cart.tip || 0;
    const total = subtotal + tax + deliveryFee - discount + tip;

    return {
      subtotal,
      tax,
      deliveryFee,
      discount,
      tip,
      total
    };
  }, [cart]);

  const itemCount = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart.items]);

  return {
    cart,
    totals,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    setOrderType,
    setAddress,
    setScheduledFor,
    setNotes,
    setTip,
    setLoyaltyDiscount
  };
}
