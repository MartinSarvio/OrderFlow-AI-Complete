// Delivery Editor Component
import { Truck, MapPin, DollarSign, Info, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { DeliveryConfig, DeliveryZone } from '@/types';

interface DeliveryEditorProps {
  delivery: DeliveryConfig;
  onChange: (delivery: DeliveryConfig) => void;
}

export function DeliveryEditor({ delivery, onChange }: DeliveryEditorProps) {
  const handleChange = <K extends keyof DeliveryConfig>(key: K, value: DeliveryConfig[K]) => {
    onChange({
      ...delivery,
      [key]: value,
    });
  };

  const addZone = () => {
    const newZone: DeliveryZone = {
      id: `zone_${Date.now()}`,
      name: 'Ny zone',
      fee: 0,
      minimumOrder: 0,
      polygon: [],
    };
    handleChange('zones', [...delivery.zones, newZone]);
  };

  const updateZone = (zoneId: string, updates: Partial<DeliveryZone>) => {
    handleChange(
      'zones',
      delivery.zones.map((zone) =>
        zone.id === zoneId ? { ...zone, ...updates } : zone
      )
    );
  };

  const deleteZone = (zoneId: string) => {
    handleChange(
      'zones',
      delivery.zones.filter((zone) => zone.id !== zoneId)
    );
  };

  return (
    <div className="space-y-6">
      {/* Enable Delivery */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium">Aktiver levering</p>
                <p className="text-sm text-gray-500">
                  Tillad kunder at få maden leveret
                </p>
              </div>
            </div>
            <Switch
              checked={delivery.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {delivery.enabled && (
        <>
          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Leveringspriser
              </CardTitle>
              <CardDescription>
                Indstil priser og minimumsordre for levering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Leveringsgebyr (kr)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={delivery.fee}
                    onChange={(e) =>
                      handleChange('fee', parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-sm text-gray-500">
                    Standard leveringsgebyr
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumOrder">Minimumsordre (kr)</Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    min="0"
                    step="0.01"
                    value={delivery.minimumOrder}
                    onChange={(e) =>
                      handleChange('minimumOrder', parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-sm text-gray-500">
                    Mindste ordreværdi for levering
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryThreshold">
                    Gratis levering ved (kr)
                  </Label>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    min="0"
                    step="0.01"
                    value={delivery.freeDeliveryThreshold || ''}
                    onChange={(e) =>
                      handleChange(
                        'freeDeliveryThreshold',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder="Valgfri"
                  />
                  <p className="text-sm text-gray-500">
                    Ordreværdi for gratis levering
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimeret leveringstid (min)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="1"
                  value={delivery.estimatedTime}
                  onChange={(e) =>
                    handleChange('estimatedTime', parseInt(e.target.value) || 30)
                  }
                />
                <p className="text-sm text-gray-500">
                  Gennemsnitlig tid fra bestilling til levering
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Zones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Leveringszoner
                </CardTitle>
                <CardDescription>
                  Definer hvor du leverer til
                </CardDescription>
              </div>
              <Button onClick={addZone} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Tilføj zone
              </Button>
            </CardHeader>
            <CardContent>
              {delivery.zones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen leveringszoner endnu</p>
                  <p className="text-sm">Tilføj zoner for at definere hvor du leverer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {delivery.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Zonenavn</Label>
                          <Input
                            value={zone.name}
                            onChange={(e) =>
                              updateZone(zone.id, { name: e.target.value })
                            }
                            placeholder="f.eks. Indre by"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Leveringsgebyr (kr)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={zone.fee}
                            onChange={(e) =>
                              updateZone(zone.id, {
                                fee: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Minimumsordre (kr)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={zone.minimumOrder}
                            onChange={(e) =>
                              updateZone(zone.id, {
                                minimumOrder: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteZone(zone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Om leveringszoner</p>
                  <p className="text-sm text-blue-700">
                    Zoner hjælper dig med at opkræve forskellige leveringsgebyrer baseret på afstand. 
                    Hvis du ikke tilføjer nogen zoner, vil standard leveringsgebyret blive brugt for alle adresser.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
