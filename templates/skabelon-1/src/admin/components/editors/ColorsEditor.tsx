// Colors Editor Component
import { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BrandingConfig } from '@/types';

interface ColorsEditorProps {
  colors: BrandingConfig['colors'];
  onChange: (colors: BrandingConfig['colors']) => void;
}

interface ColorField {
  key: keyof BrandingConfig['colors'];
  label: string;
  description: string;
}

const colorFields: ColorField[] = [
  { key: 'primary', label: 'Primær farve', description: 'Hovedfarven til knapper og links' },
  { key: 'secondary', label: 'Sekundær farve', description: 'Ekstra accentfarve' },
  { key: 'accent', label: 'Accent farve', description: 'Fremhævningsfarve' },
  { key: 'background', label: 'Baggrund', description: 'Hovedbaggrundsfarve' },
  { key: 'surface', label: 'Overflade', description: 'Kort og panel baggrund' },
  { key: 'text', label: 'Tekst', description: 'Primær tekstfarve' },
  { key: 'textMuted', label: 'Svag tekst', description: 'Sekundær/mindre vigtig tekst' },
  { key: 'success', label: 'Succes', description: 'Succes/confirmation farve' },
  { key: 'warning', label: 'Advarsel', description: 'Advarselsfarve' },
  { key: 'error', label: 'Fejl', description: 'Fejl/fare farve' },
];

const presetThemes = [
  {
    name: 'Pizza Rød',
    colors: {
      primary: '#E63946',
      secondary: '#F4A261',
      accent: '#E9C46A',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#1D3557',
      textMuted: '#457B9D',
      success: '#2A9D8F',
      warning: '#F4A261',
      error: '#E63946',
    },
  },
  {
    name: 'Sushi Grøn',
    colors: {
      primary: '#2D6A4F',
      secondary: '#40916C',
      accent: '#74C69D',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      text: '#212529',
      textMuted: '#6C757D',
      success: '#52B788',
      warning: '#FFB703',
      error: '#E63946',
    },
  },
  {
    name: 'Burger Orange',
    colors: {
      primary: '#F77F00',
      secondary: '#FCBF49',
      accent: '#EAE2B7',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      text: '#003049',
      textMuted: '#6C757D',
      success: '#06A77D',
      warning: '#FCBF49',
      error: '#D62828',
    },
  },
  {
    name: 'Café Brun',
    colors: {
      primary: '#6F4E37',
      secondary: '#A67B5B',
      accent: '#D4A574',
      background: '#FAF7F2',
      surface: '#FFFFFF',
      text: '#3D2914',
      textMuted: '#8B7355',
      success: '#5D8C55',
      warning: '#D4A574',
      error: '#C75146',
    },
  },
  {
    name: 'Mørke Mode',
    colors: {
      primary: '#BB86FC',
      secondary: '#03DAC6',
      accent: '#CF6679',
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textMuted: '#B3B3B3',
      success: '#03DAC6',
      warning: '#FFB74D',
      error: '#CF6679',
    },
  },
];

export function ColorsEditor({ colors, onChange }: ColorsEditorProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('custom');

  const handleColorChange = (key: keyof BrandingConfig['colors'], value: string) => {
    onChange({ ...colors, [key]: value });
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const applyPreset = (presetColors: typeof colors) => {
    onChange(presetColors);
  };

  const isLightColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Tilpasset</TabsTrigger>
          <TabsTrigger value="presets">Forudindstillinger</TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-6">
          {/* Preview Card */}
          <Card 
            className="overflow-hidden"
            style={{ backgroundColor: colors.background }}
          >
            <div 
              className="p-6"
              style={{ backgroundColor: colors.surface }}
            >
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: colors.text, fontFamily: 'inherit' }}
              >
                Forhåndsvisning
              </h3>
              <p style={{ color: colors.textMuted }}>
                Sådan vil din app se ud med de valgte farver
              </p>
            </div>
            <div className="p-6 space-y-4">
              <button
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: colors.primary, 
                  color: isLightColor(colors.primary) ? '#000' : '#fff' 
                }}
              >
                Primær knap
              </button>
              <button
                className="px-6 py-3 rounded-lg font-medium ml-3 transition-all"
                style={{ 
                  backgroundColor: colors.secondary, 
                  color: isLightColor(colors.secondary) ? '#000' : '#fff' 
                }}
              >
                Sekundær knap
              </button>
              <div className="flex gap-2 mt-4">
                <span 
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: colors.success, color: '#fff' }}
                >
                  Succes
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: colors.warning, color: '#000' }}
                >
                  Advarsel
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: colors.error, color: '#fff' }}
                >
                  Fejl
                </span>
              </div>
            </div>
          </Card>

          {/* Color Pickers */}
          <div className="grid gap-4 sm:grid-cols-2">
            {colorFields.map((field) => (
              <Card key={field.key}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: colors[field.key] }}
                    >
                      <input
                        type="color"
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="font-medium">{field.label}</Label>
                      <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                      <div className="flex gap-2">
                        <Input
                          value={colors[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          className="font-mono text-sm uppercase"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(colors[field.key])}
                        >
                          {copiedColor === colors[field.key] ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presetThemes.map((theme) => (
              <Card 
                key={theme.name}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => applyPreset(theme.colors as typeof colors)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{theme.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(theme.colors).slice(0, 6).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-8 h-8 rounded-md border"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Anvend tema
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
