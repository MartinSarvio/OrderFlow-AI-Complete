// Social Media Editor Component
import { Facebook, Instagram, Twitter, Link2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SocialEditorProps {
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  onChange: (social: { facebook?: string; instagram?: string; twitter?: string }) => void;
}

interface SocialPlatform {
  key: 'facebook' | 'instagram' | 'twitter';
  label: string;
  icon: React.ElementType;
  placeholder: string;
  color: string;
  prefix: string;
}

const platforms: SocialPlatform[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'ditrestaurant',
    color: '#1877F2',
    prefix: 'facebook.com/',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'ditrestaurant',
    color: '#E4405F',
    prefix: 'instagram.com/',
  },
  {
    key: 'twitter',
    label: 'Twitter / X',
    icon: Twitter,
    placeholder: 'ditrestaurant',
    color: '#1DA1F2',
    prefix: 'twitter.com/',
  },
];

export function SocialEditor({ social, onChange }: SocialEditorProps) {
  const handleChange = (key: keyof typeof social, value: string) => {
    onChange({
      ...social,
      [key]: value,
    });
  };

  const getFullUrl = (platform: SocialPlatform, username: string) => {
    if (!username) return '';
    if (username.startsWith('http')) return username;
    return `https://${platform.prefix}${username}`;
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Link2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Sociale Medier</p>
              <p className="text-sm text-gray-500">
                Tilføj links til dine sociale medier profiler. Disse vil vises i appen og på din hjemmeside.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Platforms */}
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const value = social[platform.key] || '';
        const fullUrl = getFullUrl(platform, value);

        return (
          <Card key={platform.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: platform.color }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {platform.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={platform.key}>Brugernavn eller URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {platform.prefix}
                    </span>
                    <Input
                      id={platform.key}
                      value={value}
                      onChange={(e) => handleChange(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className="pl-28"
                    />
                  </div>
                  {fullUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(fullUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Indtast dit brugernavn eller den fulde URL til din {platform.label} profil
                </p>
              </div>

              {/* Preview */}
              {fullUrl && (
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: `${platform.color}10` }}
                >
                  <Icon className="w-5 h-5" style={{ color: platform.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fullUrl}</p>
                  </div>
                  <Badge 
                    className="text-xs border"
                    style={{ borderColor: platform.color, color: platform.color }}
                  >
                    Aktiv
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Forhåndsvisning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const hasLink = !!social[platform.key];
              
              return (
                <div
                  key={platform.key}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    hasLink 
                      ? '' 
                      : 'opacity-30 grayscale'
                  }`}
                  style={{ 
                    backgroundColor: hasLink ? platform.color : '#ccc',
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            Sådan vil dine sociale medier ikoner se ud i appen
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Badge component for the preview
function Badge({ 
  children, 
  className,
  style 
}: { 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
