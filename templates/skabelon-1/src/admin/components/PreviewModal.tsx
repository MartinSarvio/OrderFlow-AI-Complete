// Preview Modal Component
import { useState } from 'react';
import { Smartphone, Monitor, Tablet, RotateCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RestaurantConfig } from '@/types';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  config: RestaurantConfig;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function PreviewModal({ open, onClose, config }: PreviewModalProps) {
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [refreshKey, setRefreshKey] = useState(0);

  // Generate preview HTML
  const generatePreviewHTML = () => {
    return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.branding.name} - Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${config.branding.fonts.body}, system-ui, sans-serif;
      background: ${config.branding.colors.background};
      color: ${config.branding.colors.text};
      line-height: 1.6;
    }
    
    .hero {
      min-height: 60vh;
      background: linear-gradient(135deg, ${config.branding.colors.primary}ee 0%, ${config.branding.colors.primary}99 40%, transparent 100%),
                  url('${config.branding.heroImage || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920'}');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      padding: 2rem;
      position: relative;
    }
    
    .hero-content {
      max-width: 600px;
      color: white;
    }
    
    .hero h1 {
      font-family: ${config.branding.fonts.heading}, Georgia, serif;
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .hero .slogan {
      font-size: 1.25rem;
      opacity: 0.9;
      margin-bottom: 1rem;
    }
    
    .hero .description {
      font-size: 1rem;
      opacity: 0.8;
      margin-bottom: 2rem;
    }
    
    .buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.875rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-size: 1rem;
    }
    
    .btn-primary {
      background: white;
      color: ${config.branding.colors.text};
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
    }
    
    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }
    
    .features {
      display: flex;
      gap: 0.75rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }
    
    .feature-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      border-radius: 2rem;
      font-size: 0.875rem;
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .menu-section {
      padding: 3rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .menu-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .menu-header h2 {
      font-family: ${config.branding.fonts.heading}, Georgia, serif;
      font-size: 2rem;
      color: ${config.branding.colors.text};
      margin-bottom: 0.5rem;
    }
    
    .menu-header p {
      color: ${config.branding.colors.textMuted};
    }
    
    .categories {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    
    .category-btn {
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      border: 1px solid ${config.branding.colors.text}20;
      background: transparent;
      color: ${config.branding.colors.text};
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }
    
    .category-btn:hover,
    .category-btn.active {
      background: ${config.branding.colors.primary};
      color: white;
      border-color: ${config.branding.colors.primary};
    }
    
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .menu-item {
      background: ${config.branding.colors.surface};
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: all 0.2s;
    }
    
    .menu-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    
    .menu-item-image {
      height: 160px;
      background: linear-gradient(135deg, ${config.branding.colors.primary}30, ${config.branding.colors.secondary}30);
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${config.branding.colors.primary};
      font-size: 3rem;
    }
    
    .menu-item-content {
      padding: 1rem;
    }
    
    .menu-item h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: ${config.branding.colors.text};
    }
    
    .menu-item p {
      font-size: 0.875rem;
      color: ${config.branding.colors.textMuted};
      margin-bottom: 0.75rem;
    }
    
    .menu-item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .price {
      font-size: 1.25rem;
      font-weight: 700;
      color: ${config.branding.colors.primary};
    }
    
    .add-btn {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: none;
      background: ${config.branding.colors.primary};
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.2s;
    }
    
    .add-btn:hover {
      transform: scale(1.1);
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      margin-right: 0.5rem;
    }
    
    .badge-popular {
      background: ${config.branding.colors.primary};
      color: white;
    }
    
    .badge-new {
      background: ${config.branding.colors.success};
      color: white;
    }
    
    .contact-section {
      background: ${config.branding.colors.surface};
      padding: 3rem 2rem;
      margin-top: 3rem;
    }
    
    .contact-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    
    .contact-content h2 {
      font-family: ${config.branding.fonts.heading}, Georgia, serif;
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      color: ${config.branding.colors.text};
    }
    
    .contact-info {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: ${config.branding.colors.textMuted};
    }
    
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }
      
      .hero .slogan {
        font-size: 1rem;
      }
      
      .menu-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <h1>${config.branding.name}</h1>
      ${config.branding.slogan ? `<p class="slogan">${config.branding.slogan}</p>` : ''}
      ${config.branding.description ? `<p class="description">${config.branding.description}</p>` : ''}
      <div class="buttons">
        <button class="btn btn-primary">Bestil nu</button>
        <button class="btn btn-secondary">Se menu</button>
      </div>
      <div class="features">
        ${config.features.delivery ? '<span class="feature-badge">🚚 Levering</span>' : ''}
        ${config.features.pickup ? '<span class="feature-badge">📍 Afhentning</span>' : ''}
        ${config.features.loyalty ? '<span class="feature-badge">⭐ Loyalty</span>' : ''}
      </div>
    </div>
  </section>
  
  <section class="menu-section">
    <div class="menu-header">
      <h2>Vores Menu</h2>
      <p>Udforsk vores lækre retter</p>
    </div>
    
    <div class="categories">
      ${config.menu.categories.map((cat, i) => `
        <button class="category-btn ${i === 0 ? 'active' : ''}">${cat.name}</button>
      `).join('')}
    </div>
    
    <div class="menu-grid">
      ${config.menu.categories[0]?.items.slice(0, 6).map(item => `
        <div class="menu-item">
          <div class="menu-item-image">🍽️</div>
          <div class="menu-item-content">
            <div>
              ${item.isPopular ? '<span class="badge badge-popular">Populær</span>' : ''}
              ${item.isNew ? '<span class="badge badge-new">Ny</span>' : ''}
            </div>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="menu-item-footer">
              <span class="price">${item.price} kr</span>
              <button class="add-btn">+</button>
            </div>
          </div>
        </div>
      `).join('') || '<p style="text-align:center;color:#999">Ingen produkter endnu</p>'}
    </div>
  </section>
  
  <section class="contact-section">
    <div class="contact-content">
      <h2>Kontakt Os</h2>
      <div class="contact-info">
        <div class="contact-item">📍 ${config.contact.address}, ${config.contact.city}</div>
        <div class="contact-item">📞 ${config.contact.phone}</div>
        <div class="contact-item">✉️ ${config.contact.email}</div>
      </div>
    </div>
  </section>
</body>
</html>
    `;
  };

  const deviceSizes: Record<DeviceType, { width: string; height: string }> = {
    mobile: { width: '375px', height: '812px' },
    tablet: { width: '768px', height: '1024px' },
    desktop: { width: '100%', height: '800px' },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Forhåndsvisning</DialogTitle>
            <div className="flex items-center gap-2">
              <Tabs value={device} onValueChange={(v) => setDevice(v as DeviceType)}>
                <TabsList>
                  <TabsTrigger value="mobile" className="gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobil
                  </TabsTrigger>
                  <TabsTrigger value="tablet" className="gap-2">
                    <Tablet className="w-4 h-4" />
                    Tablet
                  </TabsTrigger>
                  <TabsTrigger value="desktop" className="gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRefreshKey(k => k + 1)}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-100 overflow-auto p-6">
          <div 
            className="mx-auto bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
            style={{
              width: deviceSizes[device].width,
              height: deviceSizes[device].height,
              maxWidth: '100%',
            }}
          >
            <iframe
              key={refreshKey}
              srcDoc={generatePreviewHTML()}
              title="Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
