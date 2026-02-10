import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Cart, CartItem, MenuItem, SelectedOption, SelectedAddon, DeliveryAddress } from '@/types';

const CART_STORAGE_KEY = 'roma_cart';

const emptyCart: Cart = {
  items: [],
  restaurantId: 'pizzeria-roma-001',
  type: 'delivery',
  notes: '',
  tip: 0,
  loyaltyDiscount: 0,
};

interface CartContextType {
  cart: Cart;
  totals: { subtotal: number; tax: number; deliveryFee: number; discount: number; tip: number; total: number };
  itemCount: number;
  addToCart: (item: MenuItem, qty: number, options: SelectedOption[], addons: SelectedAddon[], notes?: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setOrderType: (t: 'delivery' | 'pickup' | 'table') => void;
  setAddress: (a: DeliveryAddress | undefined) => void;
  setNotes: (n: string) => void;
  setTip: (t: number) => void;
  setLoyaltyDiscount: (d: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): Cart {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return emptyCart;
}

function saveCart(cart: Cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(loadCart);

  useEffect(() => { saveCart(cart); }, [cart]);

  const addToCart = useCallback((
    menuItem: MenuItem, quantity: number, options: SelectedOption[], addons: SelectedAddon[], notes?: string
  ) => {
    setCart(prev => {
      const idx = prev.items.findIndex(i =>
        i.menuItem.id === menuItem.id &&
        JSON.stringify(i.options) === JSON.stringify(options) &&
        JSON.stringify(i.addons) === JSON.stringify(addons) &&
        i.notes === notes
      );
      if (idx >= 0) {
        const items = [...prev.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
        return { ...prev, items };
      }
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        menuItem, quantity, options, addons, notes,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    setCart(prev => ({
      ...prev,
      items: qty <= 0 ? prev.items.filter(i => i.id !== id) : prev.items.map(i => i.id === id ? { ...i, quantity: qty } : i),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const setOrderType = useCallback((type: 'delivery' | 'pickup' | 'table') => {
    setCart(prev => ({ ...prev, type }));
  }, []);

  const setAddress = useCallback((address: DeliveryAddress | undefined) => {
    setCart(prev => ({ ...prev, address }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setCart(prev => ({ ...prev, notes }));
  }, []);

  const setTip = useCallback((tip: number) => {
    setCart(prev => ({ ...prev, tip }));
  }, []);

  const setLoyaltyDiscount = useCallback((loyaltyDiscount: number) => {
    setCart(prev => ({ ...prev, loyaltyDiscount }));
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.items.reduce((sum, item) => {
      let price = item.menuItem.price;
      item.options.forEach(o => o.choices.forEach(c => { price += c.priceModifier; }));
      item.addons.forEach(a => { price += a.price; });
      return sum + price * item.quantity;
    }, 0);
    const tax = subtotal * 0.25;
    const deliveryFee = cart.type === 'delivery' ? 35 : 0;
    const discount = cart.loyaltyDiscount || 0;
    const tip = cart.tip || 0;
    return { subtotal, tax, deliveryFee, discount, tip, total: subtotal + tax + deliveryFee - discount + tip };
  }, [cart]);

  const itemCount = useMemo(() => cart.items.reduce((s, i) => s + i.quantity, 0), [cart.items]);

  return (
    <CartContext.Provider value={{
      cart, totals, itemCount, addToCart, updateQuantity, removeItem, clearCart,
      setOrderType, setAddress, setNotes, setTip, setLoyaltyDiscount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
