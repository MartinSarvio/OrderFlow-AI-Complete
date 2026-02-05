// OrderFlow PWA Generator - Footer Component
import { Heart } from 'lucide-react';
import type { RestaurantConfig } from '@/types';

interface FooterProps {
  restaurant: RestaurantConfig | null;
}

export function Footer({ restaurant }: FooterProps) {
  if (!restaurant) return null;

  const { branding, contact } = restaurant;

  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: branding.colors.text }}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={restaurant.branding.logo.url} 
                alt={branding.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 
                  className="font-bold text-xl text-white"
                  style={{ fontFamily: branding.fonts.heading }}
                >
                  {branding.name}
                </h3>
                <p className="text-gray-400 text-sm">{branding.slogan}</p>
              </div>
            </div>
            <p className="text-gray-400 max-w-sm">
              {branding.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hurtige links</h4>
            <ul className="space-y-2">
              {['Forside', 'Menu', 'Om os', 'Kontakt'].map(link => (
                <li key={link}>
                  <a 
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Kontakt</h4>
            <ul className="space-y-2 text-gray-400">
              <li>{contact.address}</li>
              <li>{contact.postalCode} {contact.city}</li>
              <li>{contact.phone}</li>
              <li>{contact.email}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              {currentYear} {branding.name}. Alle rettigheder forbeholdes.
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              Lavet med <Heart className="w-4 h-4 text-red-500" /> på OrderFlow
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
