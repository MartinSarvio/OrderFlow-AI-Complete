// OrderFlow PWA Generator - Checkout Modal Component
import { useState } from 'react';
import { X, CreditCard, Smartphone, Banknote, ChevronRight, Check, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
// Checkout Modal Component
import type { RestaurantConfig, Cart, PaymentMethod } from '@/types';

interface CheckoutModalProps {
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
  onOrderComplete: (orderNumber?: string) => void;
}

export function CheckoutModal({ 
  restaurant, 
  cart, 
  totals, 
  isOpen, 
  onClose, 
  onOrderComplete 
}: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrderNumber, setCompletedOrderNumber] = useState('');
  const [completedOrderType, setCompletedOrderType] = useState<'delivery' | 'pickup' | 'table'>('delivery');
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saveDetails, setSaveDetails] = useState(true);
  
  // Delivery address
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [floor, setFloor] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Stripe Payment Element state
  const [stripeElements, setStripeElements] = useState<any>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  if (!restaurant) return null;

  const { branding, payment } = restaurant;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(price);
  };

  const isDeliveryValid = () => {
    if (cart.type !== 'delivery') return true;
    return street && postalCode && city;
  };

  const isCustomerValid = () => {
    return customerName && customerPhone;
  };

  const isPaymentValid = () => {
    // Stripe Payment Element handles card validation
    return true;
  };

  const handleProceedToPayment = () => {
    if (isCustomerValid() && isDeliveryValid()) {
      setStep('payment');
      // Stripe element will be initialized via ref callback
    }
  };

  // Prefill customer data from FlowAuth on mount
  const prefillFromAuth = () => {
    const FlowAuth = (window as any).FlowAuth;
    if (FlowAuth) {
      const data = FlowAuth.getCustomerData();
      if (data) {
        if (data.name && !customerName) setCustomerName(data.name);
        if (data.email && !customerEmail) setCustomerEmail(data.email);
        if (data.phone && !customerPhone) setCustomerPhone(data.phone);
      }
    }
  };

  // Run prefill when dialog opens
  if (isOpen && !customerName) {
    setTimeout(prefillFromAuth, 100);
  }

  const handlePlaceOrder = async () => {
    if (!isPaymentValid()) return;

    setOrderError(null);
    setIsProcessing(true);

    try {
      const payload = {
        items: cart.items.map((item) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          notes: item.notes || '',
          modifiers: {
            options: item.options || [],
            addons: item.addons || []
          }
        })),
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined
        },
        fulfillment: {
          type: cart.type,
          address: cart.type === 'delivery' ? {
            street,
            postalCode,
            city,
            floor,
            doorCode,
            notes: deliveryNotes
          } : undefined
        },
        payment_method: paymentMethod,
        tip: totals.tip || 0,
        discount: totals.discount || 0
      };

      const response = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Kunne ikke gennemføre ordren';
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch (e) {
          // Ignore JSON parsing errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const orderNumber = data?.order_number || '';
      setCompletedOrderNumber(orderNumber);
      setCompletedOrderType(cart.type);
      setOrderComplete(true);
      setStep('confirmation');
      onOrderComplete(orderNumber);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke gennemføre ordren';
      setOrderError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setStep('details');
    setOrderComplete(false);
    setOrderError(null);
    setCompletedOrderNumber('');
    setCompletedOrderType('delivery');
  };

  // Initialize Stripe Payment Element when payment step is shown
  const initStripeElement = async () => {
    const FlowOrders = (window as any).FlowOrders;
    if (!FlowOrders || stripeReady) return;

    try {
      const result = await FlowOrders.createPaymentIntent(totals.total, {
        template: 'skabelon-1',
        source: 'web-checkout'
      });

      if (result.error) {
        console.error('Stripe init error:', result.error);
        return;
      }

      const container = document.getElementById('roma-stripe-payment');
      if (container) {
        const mounted = FlowOrders.mountPaymentElement(result.clientSecret, container);
        if (mounted.elements) {
          setStripeElements(mounted.elements);
          setStripeReady(true);
        }
      }
    } catch (err) {
      console.error('Stripe init failed:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] p-0 overflow-hidden"
        style={{ backgroundColor: branding.colors.background }}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
          <div className="flex items-center justify-between">
            <DialogTitle 
              className="text-xl font-bold"
              style={{ fontFamily: branding.fonts.heading }}
            >
              {step === 'details' && 'Dine oplysninger'}
              {step === 'payment' && 'Betaling'}
              {step === 'confirmation' && 'Ordrebekræftelse'}
            </DialogTitle>
            {!orderComplete && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Progress Steps */}
          {!orderComplete && (
            <div className="flex items-center gap-2 mt-4">
              <div 
                className="flex-1 h-2 rounded-full"
                style={{ 
                  backgroundColor: step === 'details' ? branding.colors.primary : `${branding.colors.primary}50`
                }}
              />
              <div 
                className="flex-1 h-2 rounded-full"
                style={{ 
                  backgroundColor: step === 'payment' ? branding.colors.primary : 
                                  step === 'confirmation' ? `${branding.colors.primary}50` : '#e5e5e5'
                }}
              />
              <div 
                className="flex-1 h-2 rounded-full"
                style={{ 
                  backgroundColor: step === 'confirmation' ? branding.colors.primary : '#e5e5e5'
                }}
              />
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Customer Details */}
          {step === 'details' && (
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 
                  className="font-semibold flex items-center gap-2"
                  style={{ color: branding.colors.text }}
                >
                  <User className="w-5 h-5" style={{ color: branding.colors.primary }} />
                  Kontaktoplysninger
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Navn *</Label>
                    <Input
                      id="name"
                      placeholder="Dit fulde navn"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+45 12 34 56 78"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email (valgfrit)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.dk"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {cart.type === 'delivery' && (
                <div className="space-y-4">
                  <h3 
                    className="font-semibold flex items-center gap-2"
                    style={{ color: branding.colors.text }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: branding.colors.primary }} />
                    Leveringsadresse
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="street">Gade og husnummer *</Label>
                      <Input
                        id="street"
                        placeholder="f.eks. Nørrebrogade 45"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="postal">Postnummer *</Label>
                        <Input
                          id="postal"
                          placeholder="2200"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">By *</Label>
                        <Input
                          id="city"
                          placeholder="København"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="floor">Etage (valgfrit)</Label>
                        <Input
                          id="floor"
                          placeholder="2. th."
                          value={floor}
                          onChange={(e) => setFloor(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="doorcode">Dørkode (valgfrit)</Label>
                        <Input
                          id="doorcode"
                          placeholder="1234"
                          value={doorCode}
                          onChange={(e) => setDoorCode(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Leveringsnoter (valgfrit)</Label>
                      <Input
                        id="notes"
                        placeholder="f.eks. ring på dørklokken"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Details */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save"
                  checked={saveDetails}
                  onCheckedChange={(checked) => setSaveDetails(checked as boolean)}
                />
                <Label htmlFor="save" className="text-sm cursor-pointer">
                  Gem mine oplysninger til næste gang
                </Label>
              </div>

              {/* Order Summary */}
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: branding.colors.surface }}
              >
                <h4 className="font-semibold mb-3" style={{ color: branding.colors.text }}>
                  Ordreoversigt
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: branding.colors.textMuted }}>
                    <span>Subtotal</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: branding.colors.textMuted }}>
                    <span>Moms (25%)</span>
                    <span>{formatPrice(totals.tax)}</span>
                  </div>
                  {cart.type === 'delivery' && (
                    <div className="flex justify-between" style={{ color: branding.colors.textMuted }}>
                      <span>Leveringsgebyr</span>
                      <span>{formatPrice(totals.deliveryFee)}</span>
                    </div>
                  )}
                  {totals.discount > 0 && (
                    <div className="flex justify-between" style={{ color: branding.colors.success }}>
                      <span>Rabat</span>
                      <span>-{formatPrice(totals.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg" style={{ color: branding.colors.text }}>
                    <span>Total</span>
                    <span style={{ color: branding.colors.primary }}>{formatPrice(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="p-6 space-y-6">
              {orderError && (
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ backgroundColor: `${branding.colors.error}15`, color: branding.colors.error }}
                >
                  {orderError}
                </div>
              )}
              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 
                  className="font-semibold"
                  style={{ color: branding.colors.text }}
                >
                  Vælg betalingsmetode
                </h3>
                
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  className="space-y-3"
                >
                  {payment.stripeEnabled && (
                    <div>
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <Label
                        htmlFor="card"
                        className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        style={{ 
                          borderColor: paymentMethod === 'card' ? branding.colors.primary : '#e5e5e5',
                          backgroundColor: paymentMethod === 'card' ? `${branding.colors.primary}05` : 'transparent'
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${branding.colors.primary}15` }}
                        >
                          <CreditCard className="w-5 h-5" style={{ color: branding.colors.primary }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: branding.colors.text }}>Kortbetaling</p>
                          <p className="text-sm" style={{ color: branding.colors.textMuted }}>Visa, Mastercard, etc.</p>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {payment.mobilePayEnabled && (
                    <div>
                      <RadioGroupItem value="mobilepay" id="mobilepay" className="peer sr-only" />
                      <Label
                        htmlFor="mobilepay"
                        className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        style={{ 
                          borderColor: paymentMethod === 'mobilepay' ? branding.colors.primary : '#e5e5e5',
                          backgroundColor: paymentMethod === 'mobilepay' ? `${branding.colors.primary}05` : 'transparent'
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#5A78FF15' }}
                        >
                          <Smartphone className="w-5 h-5" style={{ color: '#5A78FF' }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: branding.colors.text }}>MobilePay</p>
                          <p className="text-sm" style={{ color: branding.colors.textMuted }}>Betal med din telefon</p>
                        </div>
                      </Label>
                    </div>
                  )}
                  
                  {payment.cashEnabled && cart.type === 'pickup' && (
                    <div>
                      <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                      <Label
                        htmlFor="cash"
                        className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        style={{ 
                          borderColor: paymentMethod === 'cash' ? branding.colors.primary : '#e5e5e5',
                          backgroundColor: paymentMethod === 'cash' ? `${branding.colors.primary}05` : 'transparent'
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#52C41A15' }}
                        >
                          <Banknote className="w-5 h-5" style={{ color: '#52C41A' }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: branding.colors.text }}>Kontant</p>
                          <p className="text-sm" style={{ color: branding.colors.textMuted }}>Betal ved afhentning</p>
                        </div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {/* Stripe Payment Element */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div
                    id="roma-stripe-payment"
                    className="p-4 border rounded-lg min-h-[120px]"
                    style={{ borderColor: '#e5e5e5' }}
                    ref={() => { setTimeout(initStripeElement, 100); }}
                  />
                  {!stripeReady && (
                    <p className="text-sm text-center" style={{ color: branding.colors.textMuted }}>
                      Indl\u00e6ser betalingsformular...
                    </p>
                  )}
                </div>
              )}

              {/* MobilePay Info */}
              {paymentMethod === 'mobilepay' && (
                <div 
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: '#5A78FF10' }}
                >
                  <Smartphone className="w-5 h-5 mt-0.5" style={{ color: '#5A78FF' }} />
                  <div>
                    <p className="font-medium" style={{ color: branding.colors.text }}>
                      Du vil modtage en betalingsanmodning
                    </p>
                    <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                      Efter du har bekræftet ordren, sender vi en MobilePay anmodning til {customerPhone}
                    </p>
                  </div>
                </div>
              )}

              {/* Cash Info */}
              {paymentMethod === 'cash' && (
                <div 
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ backgroundColor: '#52C41A10' }}
                >
                  <Banknote className="w-5 h-5 mt-0.5" style={{ color: '#52C41A' }} />
                  <div>
                    <p className="font-medium" style={{ color: branding.colors.text }}>
                      Betal ved afhentning
                    </p>
                    <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                      Du betaler {formatPrice(totals.total)} når du henter din ordre
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && orderComplete && (
            <div className="p-6 text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${branding.colors.success}20` }}
              >
                <Check className="w-10 h-10" style={{ color: branding.colors.success }} />
              </div>
              
              <h3 
                className="text-2xl font-bold mb-2"
                style={{ color: branding.colors.text }}
              >
                Tak for din bestilling!
              </h3>
              
              <p className="mb-6" style={{ color: branding.colors.textMuted }}>
                Din ordre er modtaget og er under behandling. Du vil modtage en bekræftelse på SMS.
              </p>
              
              <div 
                className="p-4 rounded-xl mb-6 text-left"
                style={{ backgroundColor: branding.colors.surface }}
              >
                <p className="text-sm mb-1" style={{ color: branding.colors.textMuted }}>Ordrenummer</p>
                <p className="text-xl font-bold font-mono" style={{ color: branding.colors.text }}>
                  {completedOrderNumber ? `#${completedOrderNumber}` : '—'}
                </p>
              </div>
              
              <div className="space-y-2 text-sm" style={{ color: branding.colors.textMuted }}>
                <p>Estimeret {completedOrderType === 'delivery' ? 'levering' : 'afhentning'}:</p>
                <p className="font-semibold text-lg" style={{ color: branding.colors.text }}>
                  {new Date(Date.now() + 45 * 60000).toLocaleTimeString('da-DK', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!orderComplete && (
          <div 
            className="p-4 border-t"
            style={{ borderColor: `${branding.colors.text}10` }}
          >
            {step === 'details' && (
              <Button
                className="w-full py-6 text-lg font-semibold"
                onClick={handleProceedToPayment}
                disabled={!isCustomerValid() || !isDeliveryValid()}
                style={{ 
                  backgroundColor: isCustomerValid() && isDeliveryValid() ? branding.colors.primary : '#ccc',
                  color: '#fff'
                }}
              >
                Fortsæt til betaling
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            
            {step === 'payment' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('details')}
                >
                  Tilbage
                </Button>
                <Button
                  className="flex-[2] py-6 text-lg font-semibold"
                  onClick={handlePlaceOrder}
                  disabled={!isPaymentValid() || isProcessing}
                  style={{ 
                    backgroundColor: isPaymentValid() && !isProcessing ? branding.colors.primary : '#ccc',
                    color: '#fff'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Behandler...
                    </>
                  ) : (
                    <>
                      Betal {formatPrice(totals.total)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Close button for confirmation */}
        {orderComplete && (
          <div className="p-4">
            <Button
              className="w-full py-6 text-lg font-semibold"
              onClick={handleClose}
              style={{ 
                backgroundColor: branding.colors.primary,
                color: '#fff'
              }}
            >
              <Check className="w-5 h-5 mr-2" />
              OK
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
