// OrderFlow PWA Generator - Main App Component
import { useState, useEffect, useMemo } from 'react';
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
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCart } from '@/hooks/useCart';
import { useOffline } from '@/hooks/useOffline';
import { mockUser } from '@/data/mockData';
import type { MenuItem, RestaurantConfig } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderHistory, setOrderHistory] = useState<string[]>([]);
  const [externalConfig, setExternalConfig] = useState<Partial<RestaurantConfig> | null>(null);

  const { restaurant: baseRestaurant, loading, error, isOpen, getNextOpeningTime } = useRestaurant('pizzeria-roma-001');

  // Merge external config with base restaurant
  const restaurant = useMemo(() => {
    if (!baseRestaurant) return null;
    if (!externalConfig) return baseRestaurant;

    // Deep merge external config over base restaurant
    return {
      ...baseRestaurant,
      branding: {
        ...baseRestaurant.branding,
        ...externalConfig.branding,
        colors: {
          ...baseRestaurant.branding.colors,
          ...externalConfig.branding?.colors
        },
        fonts: {
          ...baseRestaurant.branding.fonts,
          ...externalConfig.branding?.fonts
        }
      },
      contact: {
        ...baseRestaurant.contact,
        ...externalConfig.contact,
        socialMedia: {
          ...baseRestaurant.contact.socialMedia,
          ...externalConfig.contact?.socialMedia
        }
      },
      businessHours: {
        ...baseRestaurant.businessHours,
        ...externalConfig.businessHours
      },
      delivery: {
        ...baseRestaurant.delivery,
        ...externalConfig.delivery
      },
      features: {
        ...baseRestaurant.features,
        ...externalConfig.features
      },
      menu: {
        ...baseRestaurant.menu,
        ...externalConfig.menu
      }
    } as RestaurantConfig;
  }, [baseRestaurant, externalConfig]);

  // Listen for config updates from parent window OR load from localStorage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_RESTAURANT_CONFIG') {
        setExternalConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if we're in iframe or standalone mode
    if (window.parent !== window) {
      // In iframe - notify parent that we're ready
      window.parent.postMessage({ type: 'WEBBUILDER_READY' }, '*');
    } else {
      // Standalone mode (new tab) - try to load config from localStorage
      try {
        const savedConfig = localStorage.getItem('orderflow_webbuilder_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setExternalConfig(config);
        }
      } catch (e) {
        console.warn('Could not load config from localStorage:', e);
      }
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);
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

  const handleOrderComplete = () => {
    setCheckoutOpen(false);
    clearCart();
    setOrderHistory(prev => [...prev, `ORD-${Date.now()}`]);
    toast.success('Ordren er gennemført!', {
      description: 'Tak for din bestilling'
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
    <div className="min-h-screen flex flex-col">
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
      <main className="flex-1">
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
          user={mockUser}
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

export default App;
