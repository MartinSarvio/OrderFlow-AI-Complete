// OrderFlow PWA Generator - Loyalty Section Component
import { Star, Gift, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { RestaurantConfig, User } from '@/types';

interface LoyaltySectionProps {
  restaurant: RestaurantConfig | null;
  user: User | null;
}

export function LoyaltySection({ restaurant, user }: LoyaltySectionProps) {
  if (!restaurant || !restaurant.loyalty?.enabled) return null;

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
    <section id="loyalty" className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: `${branding.colors.primary}15` }}
          >
            <Star className="w-5 h-5" style={{ color: branding.colors.primary }} />
            <span 
              className="font-semibold"
              style={{ color: branding.colors.primary }}
            >
              Loyalty Program
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
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
        {user && (
          <Card className="max-w-md mx-auto mb-10">
            <CardContent className="p-6">
              <div className="text-center">
                <p 
                  className="text-sm mb-2"
                  style={{ color: branding.colors.textMuted }}
                >
                  Dine point
                </p>
                <p 
                  className="text-5xl font-bold mb-4"
                  style={{ color: branding.colors.primary }}
                >
                  {userPoints}
                </p>
                
                {nextReward && (
                  <>
                    <p 
                      className="text-sm mb-3"
                      style={{ color: branding.colors.textMuted }}
                    >
                      {nextReward.pointsCost - userPoints} point til <strong>{nextReward.name}</strong>
                    </p>
                    <Progress 
                      value={progressToNext} 
                      className="h-3"
                      style={{ 
                        backgroundColor: `${branding.colors.primary}20`,
                      }}
                    />
                  </>
                )}

                {!nextReward && (
                  <p 
                    className="text-sm font-medium"
                    style={{ color: branding.colors.success }}
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Du kan indløse alle belønninger!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
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
              className="text-center p-6 rounded-2xl"
              style={{ backgroundColor: branding.colors.surface }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${branding.colors.primary}15` }}
              >
                <step.icon className="w-7 h-7" style={{ color: branding.colors.primary }} />
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
            className="text-2xl font-bold text-center mb-6"
            style={{ color: branding.colors.text }}
          >
            Tilgængelige belønninger
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyalty?.rewards.map(reward => {
              const canRedeem = userPoints >= reward.pointsCost;
              return (
                <Card 
                  key={reward.id}
                  className={`transition-all ${canRedeem ? 'ring-2 ring-primary' : 'opacity-75'}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 
                          className="font-semibold"
                          style={{ color: branding.colors.text }}
                        >
                          {reward.name}
                        </h4>
                        <p 
                          className="text-sm"
                          style={{ color: branding.colors.textMuted }}
                        >
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
                    <Button
                      className="w-full"
                      disabled={!canRedeem}
                      style={{ 
                        backgroundColor: canRedeem ? branding.colors.primary : '#ccc',
                        color: '#fff'
                      }}
                    >
                      {canRedeem ? 'Indløs nu' : `${reward.pointsCost - userPoints} point mangler`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Welcome Bonus */}
        {!user && (
          <div 
            className="mt-10 p-6 rounded-2xl text-center"
            style={{ backgroundColor: `${branding.colors.accent}15` }}
          >
            <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: branding.colors.accent }} />
            <h3 
              className="text-xl font-bold mb-2"
              style={{ color: branding.colors.text }}
            >
              Få {loyalty?.welcomeBonus} velkomstpoint!
            </h3>
            <p 
              className="mb-4"
              style={{ color: branding.colors.textMuted }}
            >
              Opret en konto og få {loyalty?.welcomeBonus} bonuspoint med det samme
            </p>
            <Button
              style={{ 
                backgroundColor: branding.colors.accent,
                color: '#fff'
              }}
            >
              Opret konto
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
