// OrderFlow PWA Generator - Profile Modal Component
import { useState } from 'react';
import { X, User as UserIcon, Phone, Mail, MapPin, Star, Package, LogOut, Edit2, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { RestaurantConfig, User as UserType } from '@/types';

interface ProfileModalProps {
  restaurant: RestaurantConfig | null;
  user: UserType | null;
  orderHistory: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ restaurant, user, isOpen, onClose }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  if (!restaurant) return null;

  const { branding, loyalty } = restaurant;
  const userPoints = user?.loyaltyPoints?.[restaurant.id] || 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSave = () => {
    setIsEditing(false);
    // In production, this would save to backend
  };

  const mockOrders = [
    { id: 'ORD-001', date: '2024-01-25', total: 185, status: 'Leveret', items: 3 },
    { id: 'ORD-002', date: '2024-01-20', total: 245, status: 'Leveret', items: 4 },
    { id: 'ORD-003', date: '2024-01-15', total: 120, status: 'Leveret', items: 2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] p-0 overflow-hidden"
        style={{ backgroundColor: branding.colors.background }}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b" style={{ borderColor: `${branding.colors.text}10` }}>
          <div className="flex items-center justify-between">
            <DialogTitle 
              className="text-xl font-bold flex items-center gap-2"
              style={{ fontFamily: branding.fonts.heading }}
            >
              <UserIcon className="w-5 h-5" />
              Min profil
            </DialogTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-140px)]">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full grid grid-cols-3 m-0 rounded-none border-b">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="orders">Ordrer</TabsTrigger>
              <TabsTrigger value="loyalty">Point</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6 space-y-6 mt-0">
              {/* User Info Card */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${branding.colors.primary}15` }}
                      >
                        <UserIcon className="w-8 h-8" style={{ color: branding.colors.primary }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" style={{ color: branding.colors.text }}>
                          {user?.name || 'Gæst'}
                        </h3>
                        <p style={{ color: branding.colors.textMuted }}>
                          {user?.phone || 'Intet telefonnummer'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <Check className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="edit-name">Navn</Label>
                        <Input
                          id="edit-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Telefon</Label>
                        <Input
                          id="edit-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handleSave}
                        style={{ backgroundColor: branding.colors.primary, color: '#fff' }}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Gem ændringer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4" style={{ color: branding.colors.textMuted }} />
                        <span style={{ color: branding.colors.text }}>{user?.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4" style={{ color: branding.colors.textMuted }} />
                        <span style={{ color: branding.colors.text }}>{user?.email || '-'}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Saved Addresses */}
              <div>
                <h4 
                  className="font-semibold mb-3 flex items-center gap-2"
                  style={{ color: branding.colors.text }}
                >
                  <MapPin className="w-5 h-5" style={{ color: branding.colors.primary }} />
                  Gemte adresser
                </h4>
                <div className="space-y-2">
                  {user?.addresses.map((address: { street: string; city: string; postalCode: string; floor?: string }, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <p style={{ color: branding.colors.text }}>{address.street}</p>
                        <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                          {address.postalCode} {address.city}
                        </p>
                        {address.floor && (
                          <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                            {address.floor}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Tilføj ny adresse
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="p-6 space-y-4 mt-0">
              <h3 
                className="font-semibold flex items-center gap-2"
                style={{ color: branding.colors.text }}
              >
                <Package className="w-5 h-5" style={{ color: branding.colors.primary }} />
                Ordrehistorik
              </h3>
              
              {mockOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package 
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: branding.colors.textMuted }}
                  />
                  <p style={{ color: branding.colors.textMuted }}>Ingen ordrer endnu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mockOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-semibold" style={{ color: branding.colors.text }}>
                            #{order.id}
                          </span>
                          <span 
                            className="text-sm px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: `${branding.colors.success}20`,
                              color: branding.colors.success 
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: branding.colors.textMuted }}>
                            {new Date(order.date).toLocaleDateString('da-DK')}
                          </span>
                          <span style={{ color: branding.colors.textMuted }}>
                            {order.items} varer
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: `${branding.colors.text}10` }}>
                          <span className="font-semibold" style={{ color: branding.colors.primary }}>
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Loyalty Tab */}
            <TabsContent value="loyalty" className="p-6 space-y-6 mt-0">
              {/* Points Card */}
              <Card 
                className="border-2"
                style={{ borderColor: branding.colors.primary }}
              >
                <CardContent className="p-6 text-center">
                  <Star 
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: branding.colors.primary }}
                  />
                  <p className="text-sm mb-1" style={{ color: branding.colors.textMuted }}>
                    Dine point
                  </p>
                  <p 
                    className="text-5xl font-bold mb-2"
                    style={{ color: branding.colors.primary }}
                  >
                    {userPoints}
                  </p>
                  <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                    Optjen {loyalty?.pointsPerCurrency || 1} point for hver krone du bruger
                  </p>
                </CardContent>
              </Card>

              {/* Progress to next reward */}
              {loyalty?.rewards && loyalty.rewards.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3" style={{ color: branding.colors.text }}>
                    Næste belønning
                  </h4>
                  {(() => {
                    const nextReward = [...loyalty.rewards]
                      .sort((a, b) => a.pointsCost - b.pointsCost)
                      .find(r => r.pointsCost > userPoints);
                    
                    if (!nextReward) {
                      return (
                        <p style={{ color: branding.colors.success }}>
                          <Check className="w-4 h-4 inline mr-1" />
                          Du kan indløse alle belønninger!
                        </p>
                      );
                    }

                    const progress = (userPoints / nextReward.pointsCost) * 100;
                    
                    return (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span style={{ color: branding.colors.text }}>{nextReward.name}</span>
                            <span style={{ color: branding.colors.primary }}>
                              {userPoints} / {nextReward.pointsCost} point
                            </span>
                          </div>
                          <div 
                            className="h-3 rounded-full overflow-hidden"
                            style={{ backgroundColor: `${branding.colors.primary}20` }}
                          >
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: branding.colors.primary 
                              }}
                            />
                          </div>
                          <p className="text-sm mt-2" style={{ color: branding.colors.textMuted }}>
                            {nextReward.pointsCost - userPoints} point mangler
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              )}

              {/* Available Rewards */}
              {loyalty?.rewards && (
                <div>
                  <h4 className="font-semibold mb-3" style={{ color: branding.colors.text }}>
                    Tilgængelige belønninger
                  </h4>
                  <div className="space-y-2">
                    {loyalty.rewards.map((reward) => {
                      const canRedeem = userPoints >= reward.pointsCost;
                      return (
                        <Card 
                          key={reward.id}
                          className={canRedeem ? 'ring-2 ring-primary' : 'opacity-75'}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold" style={{ color: branding.colors.text }}>
                                  {reward.name}
                                </p>
                                <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                                  {reward.description}
                                </p>
                              </div>
                              <div 
                                className="flex items-center gap-1 px-3 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: canRedeem 
                                    ? `${branding.colors.success}20` 
                                    : `${branding.colors.primary}15`
                                }}
                              >
                                <Star 
                                  className="w-4 h-4" 
                                  style={{ 
                                    color: canRedeem ? branding.colors.success : branding.colors.primary 
                                  }} 
                                />
                                <span 
                                  className="font-semibold text-sm"
                                  style={{ 
                                    color: canRedeem ? branding.colors.success : branding.colors.primary 
                                  }}
                                >
                                  {reward.pointsCost}
                                </span>
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
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: `${branding.colors.text}10` }}
        >
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Luk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
