// OrderFlow PWA Generator - Loyalty Section Component
import { Star, Gift, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { RestaurantConfig, User } from '@/types';

interface LoyaltySectionProps {
  restaurant: RestaurantConfig | null;
  user: User | null;
}

export function LoyaltySection({ restaurant, user }: LoyaltySectionProps) {
  // Only show loyalty section if user is logged in and loyalty is enabled
  if (!restaurant || !restaurant.loyalty?.enabled || !user) {
    return null;
  }

  const { branding, loyalty } = restaurant;
  const userPoints = user?.loyaltyPoints?.[restaurant.id] || 0;

  const nextReward = loyalty?.rewards
    .slice()
    .sort((a, b) => a.pointsCost - b.pointsCost)
    .find(r => r.pointsCost > userPoints);

  const progressToNext = nextReward 
    ? Math.min(100, (userPoints / nextReward.pointsCost) * 100)
    : 100;

  return (
    <section id="loyalty" className="py-16 md:py-24" style={{ backgroundColor: branding.colors.surface }}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: `${branding.colors.primary}15` }}
          >
            <Star className="w-5 h-5" style={{ color: branding.colors.primary }} />
            <span 
              className="font-semibold text-sm"
              style={{ color: branding.colors.primary }}
            >
              Dit Loyalty Program
            </span>
          </div>
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              fontFamily: branding.fonts.heading,
              color: branding.colors.text 
            }}
          >
            Tjen point og få belønninger
          </h2>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: branding.colors.textMuted }}
          >
            For hver krone du bruger, optjener du point som kan bruges på lækre belønninger
          </p>
        </div>

        {/* Points Card */}
        <Card className="max-w-md mx-auto mb-12 border-2 shadow-xl" style={{ borderColor: `${branding.colors.primary}30` }}>
          <CardContent className="p-8">
            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${branding.colors.primary}15` }}
              >
                <Star className="w-10 h-10" style={{ color: branding.colors.primary }} />
              </div>
              <p 
                className="text-sm mb-1"
                style={{ color: branding.colors.textMuted }}
              >
                Dine optjente point
              </p>
              <p 
                className="text-6xl font-bold mb-4"
                style={{ color: branding.colors.primary }}
              >
                {userPoints}
              </p>
              
              {nextReward && (
                <>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: branding.colors.textMuted }}
                  >
                    <span className="font-semibold" style={{ color: branding.colors.primary }}>
                      {nextReward.pointsCost - userPoints} point
                    </span>{' '}
                    til <strong>{nextReward.name}</strong>
                  </p>
                  <div className="relative">
                    <Progress 
                      value={progressToNext} 
                      className="h-3 rounded-full"
                      style={{ 
                        backgroundColor: `${branding.colors.primary}20`,
                      }}
                    />
                    <div 
                      className="absolute -bottom-6 left-0 text-xs font-medium"
                      style={{ color: branding.colors.textMuted }}
                    >
                      0
                    </div>
                    <div 
                      className="absolute -bottom-6 right-0 text-xs font-medium"
                      style={{ color: branding.colors.textMuted }}
                    >
                      {nextReward.pointsCost}
                    </div>
                  </div>
                </>
              )}

              {!nextReward && (
                <div 
                  className="flex items-center justify-center gap-2 text-lg font-medium"
                  style={{ color: branding.colors.success }}
                >
                  <Check className="w-5 h-5" />
                  Du kan indløse alle belønninger!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Star,
              title: '1. Bestil mad',
              description: `For hver krone du bruger, får du ${loyalty?.pointsPerCurrency || 1} point`
            },
            {
              icon: Gift,
              title: '2. Saml point',
              description: 'Dine point gemmes automatisk på din konto'
            },
            {
              icon: Check,
              title: '3. Få belønninger',
              description: 'Brug dine point på lækre belønninger'
            }
          ].map((step, index) => (
            <div 
              key={index}
              className="text-center p-8 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${branding.colors.primary}15` }}
              >
                <step.icon className="w-8 h-8" style={{ color: branding.colors.primary }} />
              </div>
              <h3 
                className="font-semibold text-lg mb-2"
                style={{ color: branding.colors.text }}
              >
                {step.title}
              </h3>
              <p style={{ color: branding.colors.textMuted }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Rewards */}
        <div>
          <h3 
            className="text-2xl font-bold text-center mb-8"
            style={{ color: branding.colors.text }}
          >
            Tilgængelige belønninger
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loyalty?.rewards.map(reward => {
              const canRedeem = userPoints >= reward.pointsCost;
              return (
                <Card 
                  key={reward.id}
                  className={`transition-all duration-300 hover:shadow-lg ${canRedeem ? 'ring-2 ring-primary hover:-translate-y-1' : 'opacity-70'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 
                          className="font-semibold text-lg"
                          style={{ color: branding.colors.text }}
                        >
                          {reward.name}
                        </h4>
                        <p 
                          className="text-sm mt-1"
                          style={{ color: branding.colors.textMuted }}
                        >
                          {reward.description}
                        </p>
                      </div>
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ 
                          backgroundColor: canRedeem 
                            ? `${branding.colors.success}15` 
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
                          className="font-bold text-sm"
                          style={{ 
                            color: canRedeem ? branding.colors.success : branding.colors.primary 
                          }}
                        >
                          {reward.pointsCost}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full transition-all duration-300"
                      disabled={!canRedeem}
                      style={{ 
                        backgroundColor: canRedeem ? branding.colors.primary : '#e5e5e5',
                        color: canRedeem ? '#fff' : '#999'
                      }}
                    >
                      {canRedeem ? (
                        'Indløs nu'
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          {reward.pointsCost - userPoints} point mangler
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
