// Branding Editor Component
import { Store, Type, AlignLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { BrandingConfig } from '@/types';

interface BrandingEditorProps {
  branding: BrandingConfig;
  onChange: (branding: BrandingConfig) => void;
}

export function BrandingEditor({ branding, onChange }: BrandingEditorProps) {
  const handleChange = (field: keyof BrandingConfig, value: string) => {
    onChange({ ...branding, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Restaurant Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Restaurant Navn
          </CardTitle>
          <CardDescription>
            Navnet på din restaurant som vises i appen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fuldt navn</Label>
              <Input
                id="name"
                value={branding.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="f.eks. Pizzeria Roma"
              />
              <p className="text-sm text-gray-500">
                Det fulde navn på din restaurant
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shortName">Kort navn</Label>
              <Input
                id="shortName"
                value={branding.shortName}
                onChange={(e) => handleChange('shortName', e.target.value)}
                placeholder="f.eks. Roma"
              />
              <p className="text-sm text-gray-500">
                Et kortere navn til mobile enheder og notifikationer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slogan & Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlignLeft className="w-5 h-5" />
            Slogan & Beskrivelse
          </CardTitle>
          <CardDescription>
            Beskriv din restaurant for kunderne
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              value={branding.slogan || ''}
              onChange={(e) => handleChange('slogan', e.target.value)}
              placeholder="f.eks. Autentisk italiensk pizza siden 1985"
            />
            <p className="text-sm text-gray-500">
              En kort, catchy sætning der beskriver din restaurant
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={branding.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Fortæl kunderne om din restaurant..."
              rows={4}
            />
            <p className="text-sm text-gray-500">
              En længere beskrivelse der vises på forsiden
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Skrifttyper
          </CardTitle>
          <CardDescription>
            Vælg skrifttyper til din app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Overskrifter</Label>
              <select
                id="headingFont"
                value={branding.fonts.heading}
                onChange={(e) => onChange({
                  ...branding,
                  fonts: { ...branding.fonts, heading: e.target.value }
                })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="system-ui">System (standard)</option>
                <option value="Georgia, serif">Georgia (serif)</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
                <option value="'Poppins', sans-serif">Poppins</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
              </select>
              <p 
                className="text-lg p-3 bg-gray-50 rounded-md"
                style={{ fontFamily: branding.fonts.heading }}
              >
                Eksempel på overskrift
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bodyFont">Brødtekst</Label>
              <select
                id="bodyFont"
                value={branding.fonts.body}
                onChange={(e) => onChange({
                  ...branding,
                  fonts: { ...branding.fonts, body: e.target.value }
                })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="system-ui">System (standard)</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
                <option value="'Lato', sans-serif">Lato</option>
                <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
              <p 
                className="text-sm p-3 bg-gray-50 rounded-md"
                style={{ fontFamily: branding.fonts.body }}
              >
                Dette er et eksempel på brødtekst. Lorem ipsum dolor sit amet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
