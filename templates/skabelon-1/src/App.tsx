// OrderFlow PWA Generator - Main App Component with Admin Routing
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { MenuSection } from '@/components/MenuSection';
import { CartDrawer } from '@/components/CartDrawer';
import { AboutSection } from '@/components/AboutSection';
import { LoyaltySection } from '@/components/LoyaltySection';
import { Footer } from '@/components/Footer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { ProfileModal } from '@/components/ProfileModal';
import { AuthModal } from '@/components/AuthModal';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AdminApp } from '@/admin/AdminApp';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOffline } from '@/hooks/useOffline';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider, useCartContext } from '@/contexts/CartContext';
import type { MenuItem, User } from '@/types';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Check if we're in admin mode
const isAdminMode = () => {
  const hash = window.location.hash;
  return hash.startsWith('#/admin') || hash === '#admin';
};

function CustomerAppInner() {
  const [currentView, setCurrentView] = useState('home');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderHistory, setOrderHistory] = useState<string[]>([]);
  
  const { restaurant, loading, error, isOpen, getNextOpeningTime } = useRestaurant('pizzeria-roma-001');
  const { cart, totals, itemCount, addToCart, updateQuantity, removeItem, setOrderType, setNotes, clearCart } = useCartContext();
  const { isOnline, wasOffline } = useOffline();
  const { user, profile, signOut } = useAuth();

  const getFlowUser = (): User => {
    // Use auth profile if available
    if (user && profile) {
      return {
        id: user.id,
        phone: profile.phone || '',
        name: profile.name || 'Bruger',
        email: profile.email || '',
        addresses: [],
        favoriteRestaurants: [],
        orderHistory,
        loyaltyPoints: {},
        createdAt: user.created_at || new Date().toISOString(),
      };
    }
    // Fallback to FlowAuth
    const FlowAuth = (window as any).FlowAuth;
    const base: User = {
      id: 'guest', phone: '', name: 'Gæst', email: '',
      addresses: [], favoriteRestaurants: [], orderHistory: [],
      loyaltyPoints: {}, createdAt: new Date().toISOString(),
    };
    if (FlowAuth) {
      const data = FlowAuth.getCustomerData();
      if (data) {
        base.name = data.name || 'Gæst';
        base.email = data.email || '';
        base.phone = data.phone || '';
      }
    }
    return base;
  };

  // Handle scroll to section when view changes
  useEffect(() => {
    if (currentView === 'profile') {
      if (user) {
        setProfileOpen(true);
      } else {
        setAuthMode('login');
        setAuthOpen(true);
      }
      setCurrentView('home');
    } else if (currentView !== 'home') {
      const element = document.getElementById(currentView);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView, user]);

  const handleAddToCart = (item: MenuItem, quantity: number, options: any[], addons: any[], notes?: string) => {
    addToCart(item, quantity, options, addons, notes);
    toast.success(`${item.name} tilføjet til kurven`, {
      description: `${quantity} x ${item.name}`,
      action: { label: 'Se kurv', onClick: () => setCartOpen(true) }
    });
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderComplete = (orderNumber?: string) => {
    clearCart();
    const num = orderNumber || `ORD-${Date.now()}`;
    setOrderHistory(prev => [...prev, num]);
    toast.success('Ordren er gennemført!', {
      description: orderNumber ? `Ordrenummer: ${orderNumber}` : 'Tak for din bestilling'
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    toast.success('Du er nu logget ud');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#D4380D', borderTopColor: 'transparent' }} />
          <p className="text-gray-600">Indlæser restaurant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Der opstod en fejl</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-0">
      <OfflineBanner restaurant={restaurant} isOnline={isOnline} wasOffline={wasOffline} />

      <Header 
        restaurant={restaurant} itemCount={itemCount}
        onCartClick={() => setCartOpen(true)} onNavigate={setCurrentView} currentView={currentView}
      />

      <main className="flex-1 pt-0">
        <Hero restaurant={restaurant} isOpen={isOpen()} nextOpeningTime={getNextOpeningTime()}
          onOrderClick={() => { setCurrentView('menu'); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}
        />
        <MenuSection restaurant={restaurant} searchQuery={searchQuery} onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart} cartItems={cart.items}
        />
        <LoyaltySection restaurant={restaurant} user={getFlowUser()} />
        <AboutSection restaurant={restaurant} />
      </main>

      <Footer restaurant={restaurant} />

      <CartDrawer
        restaurant={restaurant} cart={cart} totals={totals} isOpen={cartOpen}
        onClose={() => setCartOpen(false)} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem}
        onSetOrderType={setOrderType} onSetNotes={setNotes} onCheckout={handleCheckout}
      />

      <CheckoutModal
        restaurant={restaurant} cart={cart} totals={totals} isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)} onOrderComplete={handleOrderComplete}
      />

      <ProfileModal
        restaurant={restaurant} user={getFlowUser()} orderHistory={orderHistory}
        isOpen={profileOpen} onClose={() => setProfileOpen(false)}
        onSignOut={handleSignOut}
        onLogin={() => { setProfileOpen(false); setAuthMode('login'); setAuthOpen(true); }}
      />

      <AuthModal
        restaurant={restaurant} isOpen={authOpen}
        onClose={() => setAuthOpen(false)} initialMode={authMode}
      />

      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: restaurant?.branding.colors.background,
          color: restaurant?.branding.colors.text,
          border: `1px solid ${restaurant?.branding.colors.primary}30`
        }
      }} />
    </div>
  );
}

function CustomerApp() {
  return (
    <AuthProvider restaurantId="pizzeria-roma-001">
      <CartProvider>
        <CustomerAppInner />
      </CartProvider>
    </AuthProvider>
  );
}

function App() {
  const [adminMode, setAdminMode] = useState(isAdminMode());

  useEffect(() => {
    const handleHashChange = () => setAdminMode(isAdminMode());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (adminMode) {
    return (<><AdminApp /><Toaster position="bottom-right" /></>);
  }

  return <CustomerApp />;
}

export default App;
