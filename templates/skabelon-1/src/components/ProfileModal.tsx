// OrderFlow PWA Generator - Profile Modal Component
import { useState, useEffect } from 'react';
import { X, User as UserIcon, Phone, Mail, MapPin, Star, Package, LogOut, Edit2, Check, Plus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RestaurantConfig, User as UserType } from '@/types';

interface ProfileModalProps {
  restaurant: RestaurantConfig | null;
  user: UserType | null;
  orderHistory: string[];
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onLogin?: () => void;
}

export function ProfileModal({ restaurant, user, isOpen, onClose, onSignOut, onLogin }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);

  const { user: authUser, profile, updateProfile } = useAuth();

  // Sync form values
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
    } else if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Fetch loyalty points and orders
  useEffect(() => {
    if (!isOpen || !authUser || !restaurant) return;

    const fetchData = async () => {
      // Loyalty points
      const phone = profile?.phone;
      if (phone) {
        const { data } = await supabase
          .from('loyalty_points')
          .select('points')
          .eq('restaurant_id', restaurant.id)
          .eq('customer_phone', phone)
          .maybeSingle();
        if (data) setLoyaltyPoints(data.points || 0);
      }

      // Orders
      if (profile?.id) {
        const { data } = await supabase
          .from('unified_orders')
          .select('id, order_number, total, status, fulfillment_type, line_items, created_at')
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setOrders(data);
      }
    };
    fetchData();
  }, [isOpen, authUser, profile, restaurant]);

  if (!restaurant) return null;

  const { branding, loyalty } = restaurant;
  const isLoggedIn = !!authUser;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(price);
  };

  const handleSave = async () => {
    if (profile) {
      await updateProfile({ name, phone, email });
    }
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden" style={{ backgroundColor: branding.colors.background }}>
        <DialogHeader className="p-4 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: branding.fonts.heading }}>
              <UserIcon className="w-5 h-5" />
              {isLoggedIn ? 'Min profil' : 'Gæst'}
            </DialogTitle>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-140px)]">
          {!isLoggedIn ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${branding.colors.primary}15` }}>
                <UserIcon className="w-10 h-10" style={{ color: branding.colors.primary }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: branding.colors.text }}>Log ind for at se din profil</h3>
              <p className="text-sm" style={{ color: branding.colors.textMuted }}>Optjen point, se ordrehistorik og gem dine oplysninger.</p>
              <Button onClick={onLogin} className="px-8 py-5 rounded-xl font-semibold" style={{ backgroundColor: branding.colors.primary, color: '#fff' }}>
                <LogIn className="w-4 h-4 mr-2" /> Log ind / Opret konto
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full grid grid-cols-3 m-0 rounded-none border-b">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="orders">Ordrer</TabsTrigger>
                <TabsTrigger value="loyalty">Point</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="p-6 space-y-6 mt-0">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${branding.colors.primary}15` }}>
                          <UserIcon className="w-8 h-8" style={{ color: branding.colors.primary }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg" style={{ color: branding.colors.text }}>{profile?.name || name || 'Bruger'}</h3>
                          <p style={{ color: branding.colors.textMuted }}>{profile?.phone || phone || 'Ingen telefon'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                        {isEditing ? <Check className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                      </Button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div><Label>Navn</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                        <div><Label>Telefon</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
                        <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                        <Button className="w-full" onClick={handleSave} style={{ backgroundColor: branding.colors.primary, color: '#fff' }}>
                          <Check className="w-4 h-4 mr-2" /> Gem ændringer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3"><Phone className="w-4 h-4" style={{ color: branding.colors.textMuted }} /><span>{profile?.phone || phone || '-'}</span></div>
                        <div className="flex items-center gap-3"><Mail className="w-4 h-4" style={{ color: branding.colors.textMuted }} /><span>{profile?.email || email || '-'}</span></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="p-6 space-y-4 mt-0">
                <h3 className="font-semibold flex items-center gap-2" style={{ color: branding.colors.text }}>
                  <Package className="w-5 h-5" style={{ color: branding.colors.primary }} /> Ordrehistorik
                </h3>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-3" style={{ color: branding.colors.textMuted }} />
                    <p style={{ color: branding.colors.textMuted }}>Ingen ordrer endnu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-semibold" style={{ color: branding.colors.text }}>#{order.order_number || order.id.slice(0,8)}</span>
                            <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: `${branding.colors.success}20`, color: branding.colors.success }}>
                              {order.status || 'Ukendt'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: branding.colors.textMuted }}>{new Date(order.created_at).toLocaleDateString('da-DK')}</span>
                            <span style={{ color: branding.colors.textMuted }}>{(order.line_items || []).length} varer</span>
                          </div>
                          <div className="mt-2 pt-2 border-t" style={{ borderColor: `${branding.colors.text}10` }}>
                            <span className="font-semibold" style={{ color: branding.colors.primary }}>{formatPrice(Number(order.total) || 0)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="loyalty" className="p-6 space-y-6 mt-0">
                <Card className="border-2" style={{ borderColor: branding.colors.primary }}>
                  <CardContent className="p-6 text-center">
                    <Star className="w-12 h-12 mx-auto mb-3" style={{ color: branding.colors.primary }} />
                    <p className="text-sm mb-1" style={{ color: branding.colors.textMuted }}>Dine point</p>
                    <p className="text-5xl font-bold mb-2" style={{ color: branding.colors.primary }}>{loyaltyPoints}</p>
                    <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                      Optjen {loyalty?.pointsPerCurrency || 1} point for hver krone du bruger
                    </p>
                  </CardContent>
                </Card>

                {loyalty?.rewards && loyalty.rewards.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: branding.colors.text }}>Belønninger</h4>
                    <div className="space-y-2">
                      {loyalty.rewards.map(reward => {
                        const canRedeem = loyaltyPoints >= reward.pointsCost;
                        return (
                          <Card key={reward.id} className={canRedeem ? 'ring-2 ring-primary' : 'opacity-75'}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold" style={{ color: branding.colors.text }}>{reward.name}</p>
                                  <p className="text-sm" style={{ color: branding.colors.textMuted }}>{reward.description}</p>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: canRedeem ? `${branding.colors.success}20` : `${branding.colors.primary}15` }}>
                                  <Star className="w-4 h-4" style={{ color: canRedeem ? branding.colors.success : branding.colors.primary }} />
                                  <span className="font-semibold text-sm" style={{ color: canRedeem ? branding.colors.success : branding.colors.primary }}>{reward.pointsCost}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="p-4 border-t" style={{ borderColor: `${branding.colors.text}10` }}>
          {isLoggedIn ? (
            <Button variant="outline" className="w-full" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Log ud
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={onClose}>Luk</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
