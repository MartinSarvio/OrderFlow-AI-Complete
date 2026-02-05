// Features Editor Component
import { 
  ShoppingCart, 
  Star, 
  Calendar, 
  Truck, 
  Store, 
  UtensilsCrossed, 
  Bell, 
  Users,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { FeatureFlags } from '@/types';

interface FeaturesEditorProps {
  features: FeatureFlags;
  onChange: (features: FeatureFlags) => void;
}

interface FeatureItem {
  key: keyof FeatureFlags;
  label: string;
  description: string;
  icon: React.ElementType;
}

const featureList: FeatureItem[] = [
  {
    key: 'ordering',
    label: 'Online Bestilling',
    description: 'Tillad kunder at bestille mad online',
    icon: ShoppingCart,
  },
  {
    key: 'delivery',
    label: 'Levering',
    description: 'Tilbyd levering til kundernes adresse',
    icon: Truck,
  },
  {
    key: 'pickup',
    label: 'Afhentning',
    description: 'Tillad kunder at afhente deres bestilling',
    icon: Store,
  },
  {
    key: 'loyalty',
    label: 'Loyalitetsprogram',
    description: 'Beløn stamkunder med point og rabatter',
    icon: Star,
  },
  {
    key: 'reservations',
    label: 'Bordreservation',
    description: 'Tillad kunder at reservere borde',
    icon: Calendar,
  },
  {
    key: 'tableOrdering',
    label: 'Bordbestilling',
    description: 'Kunder kan bestille ved bordet via QR-kode',
    icon: UtensilsCrossed,
  },
  {
    key: 'customerAccounts',
    label: 'Kundekonti',
    description: 'Kunder kan oprette konti og gemme informationer',
    icon: Users,
  },
  {
    key: 'pushNotifications',
    label: 'Push Notifikationer',
    description: 'Send notifikationer om ordrestatus og tilbud',
    icon: Bell,
  },
];

export function FeaturesEditor({ features, onChange }: FeaturesEditorProps) {
  const handleToggle = (key: keyof FeatureFlags) => {
    onChange({
      ...features,
      [key]: !features[key],
    });
  };

  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aktive funktioner</p>
              <p className="text-2xl font-bold">{enabledCount} af {featureList.length}</p>
            </div>
            <div className="flex gap-2">
              {enabledCount === 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Ingen aktive
                </Badge>
              )}
              {enabledCount === featureList.length && (
                <Badge className="bg-green-500">Alle aktive</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Funktioner
          </CardTitle>
          <CardDescription>
            Vælg hvilke funktioner der skal være tilgængelige i din app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureList.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = features[feature.key];
              
              return (
                <div
                  key={feature.key}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isEnabled 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggle(feature.key)}
                >
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isEnabled ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-medium cursor-pointer">
                        {feature.label}
                      </Label>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(feature.key)}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Tip</p>
              <p className="text-sm text-blue-700">
                Start med de grundlæggende funktioner som online bestilling og afhentning. 
                Du kan altid tilføje flere funktioner senere efterhånden som din forretning vokser.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
