// Business Hours Editor Component
import { useState } from 'react';
import { Clock, Copy, Check, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { BusinessHours, DayHours } from '@/types';

interface HoursEditorProps {
  hours: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

const days = [
  { key: 'monday', label: 'Mandag' },
  { key: 'tuesday', label: 'Tirsdag' },
  { key: 'wednesday', label: 'Onsdag' },
  { key: 'thursday', label: 'Torsdag' },
  { key: 'friday', label: 'Fredag' },
  { key: 'saturday', label: 'Lørdag' },
  { key: 'sunday', label: 'Søndag' },
] as const;

export function HoursEditor({ hours, onChange }: HoursEditorProps) {
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  const handleDayChange = (dayKey: keyof BusinessHours, dayHours: DayHours) => {
    onChange({
      ...hours,
      [dayKey]: dayHours,
    });
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = (hours as any)[sourceDay] as DayHours;
    const newHours = { ...hours };
    
    days.forEach(({ key }) => {
      if (key !== sourceDay) {
        (newHours as any)[key] = { ...sourceHours };
      }
    });
    
    onChange(newHours);
    setCopiedDay(sourceDay);
    setTimeout(() => setCopiedDay(null), 2000);
  };

  const setAllClosed = (closed: boolean) => {
    const newHours = { ...hours };
    days.forEach(({ key }) => {
      (newHours as any)[key] = { ...(newHours as any)[key], closed };
    });
    onChange(newHours);
  };

  const isCurrentlyOpen = () => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDay = dayNames[now.getDay()];
    const dayHours = hours[currentDay];
    
    if (dayHours.closed) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime < closeTime;
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={`w-3 h-3 rounded-full ${isCurrentlyOpen() ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <div>
                <p className="font-medium">
                  {isCurrentlyOpen() ? 'Åben nu' : 'Lukket'}
                </p>
                <p className="text-sm text-gray-500">
                  {isCurrentlyOpen() 
                    ? 'Din restaurant er åben for bestillinger'
                    : 'Din restaurant er lukket lige nu'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtige handlinger</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={() => setAllClosed(false)}>
            <Clock className="w-4 h-4 mr-2" />
            Åbn alle dage
          </Button>
          <Button variant="outline" onClick={() => setAllClosed(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Luk alle dage
          </Button>
        </CardContent>
      </Card>

      {/* Day by Day Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Åbningstider
          </CardTitle>
          <CardDescription>
            Indstil åbningstider for hver dag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map(({ key, label }) => {
            const dayHours = hours[key];
            return (
              <div key={key}>
                <div className="flex items-center gap-4">
                  {/* Day Label */}
                  <div className="w-24 font-medium">{label}</div>
                  
                  {/* Closed Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!dayHours.closed}
                      onCheckedChange={(checked) => 
                        handleDayChange(key, { ...dayHours, closed: !checked })
                      }
                    />
                    <span className="text-sm text-gray-500">
                      {dayHours.closed ? 'Lukket' : 'Åben'}
                    </span>
                  </div>
                  
                  {/* Time Inputs */}
                  {!dayHours.closed && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => 
                            handleDayChange(key, { ...dayHours, open: e.target.value })
                          }
                          className="w-28"
                        />
                        <span className="text-gray-500">til</span>
                        <Input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => 
                            handleDayChange(key, { ...dayHours, close: e.target.value })
                          }
                          className="w-28"
                        />
                      </div>
                      
                      {/* Copy Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToAllDays(key)}
                        className="ml-auto"
                      >
                        {copiedDay === key ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="ml-2">Kopier til alle</span>
                      </Button>
                    </>
                  )}
                </div>
                {key !== 'sunday' && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Tidszone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="timezone">Vælg tidszone</Label>
            <select
              id="timezone"
              value={hours.timezone}
              onChange={(e) => onChange({ ...hours, timezone: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="Europe/Copenhagen">Europa/København (CET/CEST)</option>
              <option value="Europe/Stockholm">Europa/Stockholm</option>
              <option value="Europe/Oslo">Europa/Oslo</option>
              <option value="Europe/Berlin">Europa/Berlin</option>
              <option value="Europe/London">Europa/London (GMT/BST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
