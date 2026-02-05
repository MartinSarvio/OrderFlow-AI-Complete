// Images Editor Component
import { useState, useRef } from 'react';
import { Image, X, Camera, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BrandingConfig } from '@/types';

interface ImagesEditorProps {
  branding: BrandingConfig;
  onChange: (branding: BrandingConfig) => void;
}

interface ImageUploadProps {
  label: string;
  description: string;
  currentUrl: string;
  onUpload: (url: string) => void;
  aspectRatio?: string;
  placeholderIcon: React.ElementType;
}

function ImageUpload({ label, description, currentUrl, onUpload, aspectRatio = '1/1', placeholderIcon: Icon }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    
    // In a real app, upload to server/cloud storage
    // For now, use FileReader to create a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpload(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-gray-500">{description}</p>
      
      {currentUrl ? (
        <div className="relative group">
          <div 
            className="rounded-lg overflow-hidden border-2 border-gray-200"
            style={{ aspectRatio }}
          >
            <img 
              src={currentUrl} 
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => onUpload('')}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          style={{ aspectRatio }}
        >
          <Icon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-1">Klik eller træk et billede hertil</p>
          <p className="text-xs text-gray-400">PNG, JPG, GIF op til 5MB</p>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      
      {/* URL Input Alternative */}
      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Eller indsæt billede URL..."
          value={currentUrl}
          onChange={(e) => onUpload(e.target.value)}
          className="text-sm"
        />
      </div>
    </div>
  );
}

export function ImagesEditor({ branding, onChange }: ImagesEditorProps) {
  const handleLogoChange = (url: string) => {
    onChange({
      ...branding,
      logo: { ...branding.logo, url }
    });
  };

  const handleHeroChange = (url: string) => {
    onChange({
      ...branding,
      heroImage: url
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="logo">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="hero">Hero Billede</TabsTrigger>
          <TabsTrigger value="gallery">Galleri</TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Restaurant Logo
              </CardTitle>
              <CardDescription>
                Dit logo vises i headeren og som app ikon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mx-auto">
                <ImageUpload
                  label="Logo"
                  description="Anbefalet størrelse: 512x512 pixels (kvadratisk)"
                  currentUrl={branding.logo.url}
                  onUpload={handleLogoChange}
                  aspectRatio="1/1"
                  placeholderIcon={Store}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Preview */}
          {branding.logo.url && (
            <Card>
              <CardHeader>
                <CardTitle>Forhåndsvisning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img 
                    src={branding.logo.url} 
                    alt="Logo preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{branding.name}</p>
                    <p className="text-sm text-gray-500">Sådan vil logoet se ud</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Hero Billede
              </CardTitle>
              <CardDescription>
                Baggrundsbillede til forsiden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                label="Hero Billede"
                description="Anbefalet størrelse: 1920x1080 pixels (16:9)"
                currentUrl={branding.heroImage || ''}
                onUpload={handleHeroChange}
                aspectRatio="16/9"
                placeholderIcon={Camera}
              />
            </CardContent>
          </Card>

          {/* Hero Preview */}
          {branding.heroImage && (
            <Card>
              <CardHeader>
                <CardTitle>Forhåndsvisning</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="relative h-48 rounded-lg overflow-hidden"
                  style={{
                    backgroundImage: `url(${branding.heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.primary}ee 0%, ${branding.colors.primary}99 40%, transparent 100%)`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center p-6">
                    <div>
                      <h2 
                        className="text-2xl font-bold text-white mb-1"
                        style={{ fontFamily: branding.fonts.heading }}
                      >
                        {branding.name}
                      </h2>
                      <p className="text-white/80 text-sm">{branding.slogan}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billedgalleri</CardTitle>
              <CardDescription>
                Tilføj billeder til dit galleri (kommer snart)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Galleri funktionen er under udvikling</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
