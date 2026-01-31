// OrderFlow PWA Generator - About Section Component
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import type { RestaurantConfig } from '@/types';

interface AboutSectionProps {
  restaurant: RestaurantConfig | null;
}

export function AboutSection({ restaurant }: AboutSectionProps) {
  if (!restaurant) return null;

  const { branding, contact, businessHours } = restaurant;

  const dayNames: Record<string, string> = {
    monday: 'Mandag',
    tuesday: 'Tirsdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lørdag',
    sunday: 'Søndag'
  };

  return (
    <section id="about" className="py-12 md:py-20" style={{ backgroundColor: branding.colors.surface }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* About Content */}
          <div>
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ 
                fontFamily: branding.fonts.heading,
                color: branding.colors.text 
              }}
            >
              Om {branding.name}
            </h2>
            <p 
              className="text-lg mb-6 leading-relaxed"
              style={{ color: branding.colors.textMuted }}
            >
              {branding.description || `${branding.name} er dedikeret til at servere lækker mad af højeste kvalitet. 
              Vi bruger kun de friskeste ingredienser og tilbereder hver ret med omhu og kærlighed.`}
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 
                className="text-xl font-semibold mb-4"
                style={{ color: branding.colors.text }}
              >
                Kontakt os
              </h3>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${branding.colors.primary}15` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: branding.colors.primary }} />
                </div>
                <div>
                  <p style={{ color: branding.colors.text }}>{contact.address}</p>
                  <p style={{ color: branding.colors.textMuted }}>{contact.postalCode} {contact.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${branding.colors.primary}15` }}
                >
                  <Phone className="w-5 h-5" style={{ color: branding.colors.primary }} />
                </div>
                <p style={{ color: branding.colors.text }}>{contact.phone}</p>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${branding.colors.primary}15` }}
                >
                  <Mail className="w-5 h-5" style={{ color: branding.colors.primary }} />
                </div>
                <p style={{ color: branding.colors.text }}>{contact.email}</p>
              </div>

              {/* Social Media */}
              <div className="flex gap-3 pt-2">
                {contact.socialMedia.facebook && (
                  <a 
                    href={contact.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: '#1877F2' }}
                  >
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                )}
                {contact.socialMedia.instagram && (
                  <a 
                    href={contact.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ 
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' 
                    }}
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 
              className="text-xl font-semibold mb-6"
              style={{ color: branding.colors.text }}
            >
              Åbningstider
            </h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="space-y-3">
                {Object.entries(businessHours).filter(([key]) => key !== 'timezone' && key !== 'holidays').map(([day, hours]) => {
                  const isToday = new Date().getDay() === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
                  return (
                    <div 
                      key={day}
                      className={`flex justify-between items-center py-2 px-3 rounded-lg ${isToday ? 'bg-primary/5' : ''}`}
                      style={{ backgroundColor: isToday ? `${branding.colors.primary}10` : 'transparent' }}
                    >
                      <span 
                        className="font-medium"
                        style={{ 
                          color: isToday ? branding.colors.primary : branding.colors.text 
                        }}
                      >
                        {dayNames[day]}
                      </span>
                      <span style={{ color: branding.colors.textMuted }}>
                        {(hours as { closed: boolean; open: string; close: string }).closed 
                          ? 'Lukket' 
                          : `${(hours as { open: string }).open} - ${(hours as { close: string }).close}`
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
