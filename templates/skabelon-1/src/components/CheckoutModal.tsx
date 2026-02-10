// OrderFlow PWA Generator - Checkout Modal Component
import { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Banknote, ChevronRight, Check, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RestaurantConfig, Cart, PaymentMethod } from '@/types';

interface CheckoutModalProps {
  restaurant: RestaurantConfig | null;
  cart: Cart;
  totals: { subtotal: number; tax: number; deliveryFee: number; discount: number; tip: number; total: number };
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (orderNumber?: string) => void;
}

export function CheckoutModal({ restaurant, cart, totals, isOpen, onClose, onOrderComplete }: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrderNumber, setCompletedOrderNumber] = useState('');
  const [completedOrderType, setCompletedOrderType] = useState<'delivery' | 'pickup' | 'table'>('delivery');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saveDetails, setSaveDetails] = useState(true);

  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [floor, setFloor] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [stripeReady, setStripeReady] = useState(false);
  const [_stripeElements, setStripeElements] = useState<any>(null);

  const { user, profile } = useAuth();

  // Prefill from auth profile
  useEffect(() => {
    if (!isOpen) return;
    if (profile) {
      if (profile.name && !customerName) setCustomerName(profile.name);
      if (profile.email && !customerEmail) setCustomerEmail(profile.email);
      if (profile.phone && !customerPhone) setCustomerPhone(profile.phone);
    } else {
      // Fallback to FlowAuth
      const FlowAuth = (window as any).FlowAuth;
      if (FlowAuth) {
        const data = FlowAuth.getCustomerData();
        if (data) {
          if (data.name && !customerName) setCustomerName(data.name);
          if (data.email && !customerEmail) setCustomerEmail(data.email);
          if (data.phone && !customerPhone) setCustomerPhone(data.phone);
        }
      }
    }
  }, [isOpen, profile]);

  if (!restaurant) return null;
  const { branding, payment } = restaurant;

  const formatPrice = (price: number) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(price);
  const isDeliveryValid = () => cart.type !== 'delivery' || (!!street && !!postalCode && !!city);
  const isCustomerValid = () => !!customerName && !!customerPhone;

  const handleProceedToPayment = () => {
    if (isCustomerValid() && isDeliveryValid()) setStep('payment');
  };

  const generateOrderNumber = () => {
    const prefix = 'RM';
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${num}`;
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);
    setIsProcessing(true);

    try {
      const orderNumber = generateOrderNumber();

      // Build line items
      const lineItems = cart.items.map(item => ({
        id: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        notes: item.notes || '',
        modifiers: { options: item.options || [], addons: item.addons || [] },
      }));

      // Try to save to Supabase
      let savedToDb = false;
      try {
        // Find or create customer
        let customerId: string | null = null;
        if (profile?.id) {
          customerId = profile.id;
        } else {
          // Try find by phone
          const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', restaurant.id)
            .eq('phone', customerPhone)
            .maybeSingle();

          if (existing) {
            customerId = existing.id;
          } else {
            const { data: newCust } = await supabase
              .from('customers')
              .insert({
                tenant_id: restaurant.id,
                name: customerName,
                phone: customerPhone,
                email: customerEmail || null,
                app_user_id: user?.id || null,
              })
              .select('id')
              .single();
            if (newCust) customerId = newCust.id;
          }
        }

        // Create order
        const { error: orderErr } = await supabase.from('unified_orders').insert({
          tenant_id: restaurant.id,
          source_channel: 'web',
          customer_id: customerId,
          order_number: orderNumber,
          line_items: lineItems,
          subtotal: totals.subtotal,
          delivery_fee: totals.deliveryFee,
          tax_amount: totals.tax,
          discount_amount: totals.discount,
          tip_amount: totals.tip,
          total: totals.total,
          currency: 'DKK',
          fulfillment_type: cart.type,
          delivery_address: cart.type === 'delivery' ? { street, city, postal_code: postalCode, floor, door_code: doorCode, instructions: deliveryNotes } : null,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          payment_method: paymentMethod,
          status: paymentMethod === 'cash' ? 'confirmed' : 'pending',
        });

        if (!orderErr) {
          savedToDb = true;

          // Award loyalty points if logged in
          if (user && profile?.phone) {
            const pointsEarned = Math.floor(totals.subtotal * (restaurant.loyalty?.pointsPerCurrency || 1));
            if (pointsEarned > 0) {
              // Upsert loyalty points
              const { data: existing } = await supabase
                .from('loyalty_points')
                .select('id, points, lifetime_points')
                .eq('restaurant_id', restaurant.id)
                .eq('customer_phone', profile.phone)
                .maybeSingle();

              if (existing) {
                await supabase.from('loyalty_points').update({
                  points: (existing.points || 0) + pointsEarned,
                  lifetime_points: (existing.lifetime_points || 0) + pointsEarned,
                  updated_at: new Date().toISOString(),
                }).eq('id', existing.id);
              } else {
                await supabase.from('loyalty_points').insert({
                  restaurant_id: restaurant.id,
                  customer_phone: profile.phone,
                  customer_name: profile.name,
                  customer_email: profile.email,
                  points: pointsEarned + (restaurant.loyalty?.welcomeBonus || 0),
                  lifetime_points: pointsEarned + (restaurant.loyalty?.welcomeBonus || 0),
                });
              }
            }
          }

          // Update customer stats
          if (customerId) {
            try { await supabase.rpc('increment_customer_orders', { cust_id: customerId, order_total: totals.total }); } catch { /* RPC may not exist */ }
          }
        }
      } catch (dbErr) {
        console.warn('DB save failed, falling back to API:', dbErr);
      }

      // Fallback: try API if DB save failed
      if (!savedToDb) {
        try {
          const response = await fetch('/api/public/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: lineItems,
              customer: { name: customerName, phone: customerPhone, email: customerEmail || undefined },
              fulfillment: {
                type: cart.type,
                address: cart.type === 'delivery' ? { street, postalCode, city, floor, doorCode, notes: deliveryNotes } : undefined,
              },
              payment_method: paymentMethod,
              tip: totals.tip || 0,
              discount: totals.discount || 0,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.order_number) {
              setCompletedOrderNumber(data.order_number);
              setCompletedOrderType(cart.type);
              setOrderComplete(true);
              setStep('confirmation');
              onOrderComplete(data.order_number);
              return;
            }
          }
        } catch {}
      }

      // Success
      setCompletedOrderNumber(orderNumber);
      setCompletedOrderType(cart.type);
      setOrderComplete(true);
      setStep('confirmation');
      onOrderComplete(orderNumber);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Kunne ikke gennemføre ordren');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('details');
    setOrderComplete(false);
    setOrderError(null);
    setCompletedOrderNumber('');
    setCompletedOrderType('delivery');
  };

  const initStripeElement = async () => {
    const FlowOrders = (window as any).FlowOrders;
    if (!FlowOrders || stripeReady) return;
    try {
      const result = await FlowOrders.createPaymentIntent(totals.total, { template: 'skabelon-1', source: 'web-checkout' });
      if (result.error) return;
      const container = document.getElementById('roma-stripe-payment');
      if (container) {
        const mounted = FlowOrders.mountPaymentElement(result.clientSecret, container);
        if (mounted.elements) { setStripeElements(mounted.elements); setStripeReady(true); }
      }
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden" style={{ backgroundColor: branding.colors.background }}>
        <DialogHeader className="p-4 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: branding.fonts.heading }}>
              {step === 'details' && 'Dine oplysninger'}
              {step === 'payment' && 'Betaling'}
              {step === 'confirmation' && 'Ordrebekræftelse'}
            </DialogTitle>
            {!orderComplete && (
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
            )}
          </div>
          {!orderComplete && (
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: step === 'details' ? branding.colors.primary : `${branding.colors.primary}50` }} />
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: step === 'payment' ? branding.colors.primary : step === 'confirmation' ? `${branding.colors.primary}50` : '#e5e5e5' }} />
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: step === 'confirmation' ? branding.colors.primary : '#e5e5e5' }} />
            </div>
          )}
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-180px)]">
          {step === 'details' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2" style={{ color: branding.colors.text }}>
                  <User className="w-5 h-5" style={{ color: branding.colors.primary }} /> Kontaktoplysninger
                </h3>
                <div className="space-y-3">
                  <div><Label htmlFor="name">Navn *</Label><Input id="name" placeholder="Dit fulde navn" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
                  <div><Label htmlFor="phone">Telefon *</Label><Input id="phone" type="tel" placeholder="+45 12 34 56 78" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></div>
                  <div><Label htmlFor="email">Email (valgfrit)</Label><Input id="email" type="email" placeholder="din@email.dk" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></div>
                </div>
              </div>

              {cart.type === 'delivery' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: branding.colors.text }}>
                    <MapPin className="w-5 h-5" style={{ color: branding.colors.primary }} /> Leveringsadresse
                  </h3>
                  <div className="space-y-3">
                    <div><Label htmlFor="street">Gade og husnummer *</Label><Input id="street" placeholder="f.eks. Nørrebrogade 45" value={street} onChange={e => setStreet(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label htmlFor="postal">Postnummer *</Label><Input id="postal" placeholder="2200" value={postalCode} onChange={e => setPostalCode(e.target.value)} /></div>
                      <div><Label htmlFor="city">By *</Label><Input id="city" placeholder="København" value={city} onChange={e => setCity(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label htmlFor="floor">Etage</Label><Input id="floor" placeholder="2. th." value={floor} onChange={e => setFloor(e.target.value)} /></div>
                      <div><Label htmlFor="doorcode">Dørkode</Label><Input id="doorcode" placeholder="1234" value={doorCode} onChange={e => setDoorCode(e.target.value)} /></div>
                    </div>
                    <div><Label htmlFor="notes">Leveringsnoter</Label><Input id="notes" placeholder="Ring på dørklokken" value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} /></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox id="save" checked={saveDetails} onCheckedChange={c => setSaveDetails(c as boolean)} />
                <Label htmlFor="save" className="text-sm cursor-pointer">Gem mine oplysninger</Label>
              </div>

              {user && (
                <div className="p-3 rounded-xl flex items-center gap-2 text-sm" style={{ backgroundColor: `${branding.colors.success}10`, color: branding.colors.success }}>
                  <Check className="w-4 h-4" /> Du optjener loyaltypoint med denne bestilling
                </div>
              )}

              <div className="p-4 rounded-xl" style={{ backgroundColor: branding.colors.surface }}>
                <h4 className="font-semibold mb-3" style={{ color: branding.colors.text }}>Ordreoversigt</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: branding.colors.textMuted }}><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
                  <div className="flex justify-between" style={{ color: branding.colors.textMuted }}><span>Moms (25%)</span><span>{formatPrice(totals.tax)}</span></div>
                  {cart.type === 'delivery' && <div className="flex justify-between" style={{ color: branding.colors.textMuted }}><span>Leveringsgebyr</span><span>{formatPrice(totals.deliveryFee)}</span></div>}
                  {totals.discount > 0 && <div className="flex justify-between" style={{ color: branding.colors.success }}><span>Rabat</span><span>-{formatPrice(totals.discount)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg" style={{ color: branding.colors.text }}><span>Total</span><span style={{ color: branding.colors.primary }}>{formatPrice(totals.total)}</span></div>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="p-6 space-y-6">
              {orderError && <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: `${branding.colors.error}15`, color: branding.colors.error }}>{orderError}</div>}

              <div className="space-y-4">
                <h3 className="font-semibold" style={{ color: branding.colors.text }}>Vælg betalingsmetode</h3>
                <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)} className="space-y-3">
                  {payment.stripeEnabled && (
                    <div>
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <Label htmlFor="card" className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: paymentMethod === 'card' ? branding.colors.primary : '#e5e5e5', backgroundColor: paymentMethod === 'card' ? `${branding.colors.primary}05` : 'transparent' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${branding.colors.primary}15` }}><CreditCard className="w-5 h-5" style={{ color: branding.colors.primary }} /></div>
                        <div><p className="font-medium">Kortbetaling</p><p className="text-sm" style={{ color: branding.colors.textMuted }}>Visa, Mastercard</p></div>
                      </Label>
                    </div>
                  )}
                  {payment.mobilePayEnabled && (
                    <div>
                      <RadioGroupItem value="mobilepay" id="mobilepay" className="peer sr-only" />
                      <Label htmlFor="mobilepay" className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: paymentMethod === 'mobilepay' ? branding.colors.primary : '#e5e5e5', backgroundColor: paymentMethod === 'mobilepay' ? `${branding.colors.primary}05` : 'transparent' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5A78FF15' }}><Smartphone className="w-5 h-5" style={{ color: '#5A78FF' }} /></div>
                        <div><p className="font-medium">MobilePay</p><p className="text-sm" style={{ color: branding.colors.textMuted }}>Betal med din telefon</p></div>
                      </Label>
                    </div>
                  )}
                  {payment.cashEnabled && cart.type === 'pickup' && (
                    <div>
                      <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                      <Label htmlFor="cash" className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: paymentMethod === 'cash' ? branding.colors.primary : '#e5e5e5', backgroundColor: paymentMethod === 'cash' ? `${branding.colors.primary}05` : 'transparent' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#52C41A15' }}><Banknote className="w-5 h-5" style={{ color: '#52C41A' }} /></div>
                        <div><p className="font-medium">Kontant</p><p className="text-sm" style={{ color: branding.colors.textMuted }}>Betal ved afhentning</p></div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div id="roma-stripe-payment" className="p-4 border rounded-lg min-h-[120px]" style={{ borderColor: '#e5e5e5' }} ref={() => { setTimeout(initStripeElement, 100); }} />
                  {!stripeReady && <p className="text-sm text-center" style={{ color: branding.colors.textMuted }}>Indlæser betalingsformular...</p>}
                </div>
              )}

              {paymentMethod === 'mobilepay' && (
                <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: '#5A78FF10' }}>
                  <Smartphone className="w-5 h-5 mt-0.5" style={{ color: '#5A78FF' }} />
                  <div><p className="font-medium">Du vil modtage en betalingsanmodning</p><p className="text-sm" style={{ color: branding.colors.textMuted }}>Vi sender en MobilePay anmodning til {customerPhone}</p></div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: '#52C41A10' }}>
                  <Banknote className="w-5 h-5 mt-0.5" style={{ color: '#52C41A' }} />
                  <div><p className="font-medium">Betal ved afhentning</p><p className="text-sm" style={{ color: branding.colors.textMuted }}>Du betaler {formatPrice(totals.total)} når du henter</p></div>
                </div>
              )}
            </div>
          )}

          {step === 'confirmation' && orderComplete && (
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${branding.colors.success}20` }}>
                <Check className="w-10 h-10" style={{ color: branding.colors.success }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: branding.colors.text }}>Tak for din bestilling!</h3>
              <p className="mb-6" style={{ color: branding.colors.textMuted }}>Din ordre er modtaget og er under behandling.</p>
              <div className="p-4 rounded-xl mb-6 text-left" style={{ backgroundColor: branding.colors.surface }}>
                <p className="text-sm mb-1" style={{ color: branding.colors.textMuted }}>Ordrenummer</p>
                <p className="text-xl font-bold font-mono" style={{ color: branding.colors.text }}>#{completedOrderNumber}</p>
              </div>
              <div className="space-y-2 text-sm" style={{ color: branding.colors.textMuted }}>
                <p>Estimeret {completedOrderType === 'delivery' ? 'levering' : 'afhentning'}:</p>
                <p className="font-semibold text-lg" style={{ color: branding.colors.text }}>
                  {new Date(Date.now() + 45 * 60000).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {user && (
                <div className="mt-4 p-3 rounded-xl text-sm" style={{ backgroundColor: `${branding.colors.primary}10`, color: branding.colors.primary }}>
                  <Star className="w-4 h-4 inline mr-1" /> Du har optjent ~{Math.floor(totals.subtotal)} loyaltypoint!
                </div>
              )}
            </div>
          )}
        </div>

        {!orderComplete && (
          <div className="p-4 border-t" style={{ borderColor: `${branding.colors.text}10` }}>
            {step === 'details' && (
              <Button className="w-full py-6 text-lg font-semibold" onClick={handleProceedToPayment} disabled={!isCustomerValid() || !isDeliveryValid()}
                style={{ backgroundColor: isCustomerValid() && isDeliveryValid() ? branding.colors.primary : '#ccc', color: '#fff' }}>
                Fortsæt til betaling <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            {step === 'payment' && (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>Tilbage</Button>
                <Button className="flex-[2] py-6 text-lg font-semibold" onClick={handlePlaceOrder} disabled={isProcessing}
                  style={{ backgroundColor: !isProcessing ? branding.colors.primary : '#ccc', color: '#fff' }}>
                  {isProcessing ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Behandler...</>) : `Betal ${formatPrice(totals.total)}`}
                </Button>
              </div>
            )}
          </div>
        )}

        {orderComplete && (
          <div className="p-4">
            <Button className="w-full py-6 text-lg font-semibold" onClick={handleClose} style={{ backgroundColor: branding.colors.primary, color: '#fff' }}>
              <Check className="w-5 h-5 mr-2" /> OK
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Need Star icon for loyalty display
import { Star } from 'lucide-react';
