// Contact Editor Component
import { Phone, Mail, MapPin, Globe, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContactInfo } from '@/types';

interface ContactEditorProps {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
}

export function ContactEditor({ contact, onChange }: ContactEditorProps) {
  const handleChange = (field: keyof ContactInfo, value: string) => {
    onChange({ ...contact, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Address Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Adresse
          </CardTitle>
          <CardDescription>
            Din restaurants fysiske adresse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Gade og husnummer</Label>
            <Input
              id="address"
              value={contact.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="f.eks. Hovedgade 123"
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postnummer</Label>
              <Input
                id="postalCode"
                value={contact.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="f.eks. 1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">By</Label>
              <Input
                id="city"
                value={contact.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="f.eks. København"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Kontaktoplysninger
          </CardTitle>
          <CardDescription>
            Telefon og email til kundekontakt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={contact.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="f.eks. +45 12 34 56 78"
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Telefonnummeret vises i appen og på kvitteringer
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={contact.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="f.eks. info@ditrestaurant.dk"
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Email til ordrebekræftelser og kundeservice
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Hjemmeside (valgfri)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="website"
                value={contact.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="f.eks. https://ditrestaurant.dk"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Forhåndsvisning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-gray-600">{contact.address}</p>
                <p className="text-gray-600">{contact.postalCode} {contact.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Telefon</p>
                <p className="text-gray-600">{contact.phone || 'Ikke angivet'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-600">{contact.email || 'Ikke angivet'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
