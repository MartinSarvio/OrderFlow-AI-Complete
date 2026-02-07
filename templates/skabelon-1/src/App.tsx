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
import { OfflineBanner } from '@/components/OfflineBanner';
import { AdminApp } from '@/admin/AdminApp';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCart } from '@/hooks/useCart';
import { useOffline } from '@/hooks/useOffline';
// Customer data from FlowAuth (replaces mockUser)
const getFlowUser = () => {
  const FlowAuth = (window as any).FlowAuth;
  if (FlowAuth) {
    const data = FlowAuth.getCustomerData();
    if (data) return { name: data.name, email: data.email, phone: data.phone, loyaltyPoints: 0, loyaltyTier: 'bronze' as const };
  }
  return { name: 'G\u00e6st', email: '', phone: '', loyaltyPoints: 0, loyaltyTier: 'bronze' as const };
};
import type { MenuItem } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Check if we're in admin mode
const isAdminMode = () => {
  const hash = window.location.hash;
  return hash.startsWith('#/admin') || hash === '#admin';
};

function CustomerApp() {
  const [currentView, setCurrentView] = useState('home');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderHistory, setOrderHistory] = useState<string[]>([]);
  
  const { restaurant, loading, error, isOpen, getNextOpeningTime } = useRestaurant('pizzeria-roma-001');
  const { 
    cart, 
    totals, 
    itemCount, 
    addToCart, 
    updateQuantity, 
    removeItem, 
    setOrderType, 
    setNotes,
    clearCart
  } = useCart();
  const { isOnline, wasOffline } = useOffline();

  // Handle scroll to section when view changes
  useEffect(() => {
    if (currentView !== 'home' && currentView !== 'profile') {
      const element = document.getElementById(currentView);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (currentView === 'profile') {
      setProfileOpen(true);
      setCurrentView('home');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView]);

  const handleAddToCart = (
    item: MenuItem, 
    quantity: number, 
    options: any[], 
    addons: any[], 
    notes?: string
  ) => {
    addToCart(item, quantity, options, addons, notes);
    toast.success(`${item.name} tilføjet til kurven`, {
      description: `${quantity} x ${item.name}`,
      action: {
        label: 'Se kurv',
        onClick: () => setCartOpen(true)
      }
    });
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderComplete = (orderNumber?: string) => {
    clearCart();
    if (orderNumber) {
      setOrderHistory(prev => [...prev, orderNumber]);
    } else {
      setOrderHistory(prev => [...prev, `ORD-${Date.now()}`]);
    }
    toast.success('Ordren er gennemført!', {
      description: orderNumber ? `Ordrenummer: ${orderNumber}` : 'Tak for din bestilling'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#D4380D', borderTopColor: 'transparent' }}
          />
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
      {/* Offline Banner */}
      <OfflineBanner 
        restaurant={restaurant}
        isOnline={isOnline}
        wasOffline={wasOffline}
      />

      {/* Header */}
      <Header 
        restaurant={restaurant}
        itemCount={itemCount}
        onCartClick={() => setCartOpen(true)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      {/* Main Content */}
      <main className="flex-1 pt-0">
        {/* Hero Section */}
        <Hero 
          restaurant={restaurant}
          isOpen={isOpen()}
          nextOpeningTime={getNextOpeningTime()}
          onOrderClick={() => {
            setCurrentView('menu');
            document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Menu Section */}
        <MenuSection
          restaurant={restaurant}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart}
          cartItems={cart.items}
        />

        {/* Loyalty Section */}
        <LoyaltySection 
          restaurant={restaurant}
          user={getFlowUser()}
        />

        {/* About Section */}
        <AboutSection restaurant={restaurant} />
      </main>

      {/* Footer */}
      <Footer restaurant={restaurant} />

      {/* Cart Drawer */}
      <CartDrawer
        restaurant={restaurant}
        cart={cart}
        totals={totals}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onSetOrderType={setOrderType}
        onSetNotes={setNotes}
        onCheckout={handleCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        restaurant={restaurant}
        cart={cart}
        totals={totals}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderComplete={handleOrderComplete}
      />

      {/* Profile Modal */}
      <ProfileModal
        restaurant={restaurant}
        user={mockUser}
        orderHistory={orderHistory}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: restaurant?.branding.colors.background,
            color: restaurant?.branding.colors.text,
            border: `1px solid ${restaurant?.branding.colors.primary}30`
          }
        }}
      />
    </div>
  );
}

function App() {
  const [adminMode, setAdminMode] = useState(isAdminMode());

  useEffect(() => {
    const handleHashChange = () => {
      setAdminMode(isAdminMode());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Render admin or customer app based on URL
  if (adminMode) {
    return (
      <>
        <AdminApp />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return <CustomerApp />;
}

export default App;
