// OrderFlow Admin Dashboard
import { useState } from 'react';
import { 
  Palette, 
  Image, 
  Clock, 
  Phone, 
  Utensils, 
  Tags, 
  Share2, 
  ChevronLeft,
  Save,
  Eye,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantConfig } from './hooks/useRestaurantConfig';
import { BrandingEditor } from './components/editors/BrandingEditor';
import { ColorsEditor } from './components/editors/ColorsEditor';
import { ImagesEditor } from './components/editors/ImagesEditor';
import { HoursEditor } from './components/editors/HoursEditor';
import { ContactEditor } from './components/editors/ContactEditor';
import { MenuEditor } from './components/editors/MenuEditor';
import { FeaturesEditor } from './components/editors/FeaturesEditor';
import { SocialEditor } from './components/editors/SocialEditor';
import { DeliveryEditor } from './components/editors/DeliveryEditor';
import { PreviewModal } from './components/PreviewModal';

type TabId = 'branding' | 'colors' | 'images' | 'hours' | 'contact' | 'menu' | 'features' | 'social' | 'delivery';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { id: 'branding', label: 'Branding', icon: Store },
  { id: 'colors', label: 'Farver', icon: Palette },
  { id: 'images', label: 'Billeder', icon: Image },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'hours', label: 'Åbningstider', icon: Clock },
  { id: 'contact', label: 'Kontakt', icon: Phone },
  { id: 'delivery', label: 'Levering', icon: Store },
  { id: 'features', label: 'Funktioner', icon: Tags },
  { id: 'social', label: 'Sociale Medier', icon: Share2 },
];

export function AdminApp() {
  const [activeTab, setActiveTab] = useState<TabId>('branding');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { config, updateConfig, saveConfig, hasChanges, isLoading } = useRestaurantConfig();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveConfig();
      toast({
        title: 'Gemt!',
        description: 'Dine ændringer er blevet gemt.',
      });
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke gemme ændringer. Prøv igen.',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Indlæser...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Kunne ikke indlæse konfiguration</p>
          <Button onClick={() => window.location.reload()}>Prøv igen</Button>
        </div>
      </div>
    );
  }

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Store;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-white border-r z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b">
          <div className="flex items-center gap-3 overflow-hidden">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: config.branding.colors.primary }}
            >
              <Store className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{config.branding.name}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-64px-80px)]">
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ color: isActive ? config.branding.colors.primary : undefined }}
                  title={sidebarCollapsed ? tab.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t bg-white">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
            title={sidebarCollapsed ? 'Udvid' : 'Minimer'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <ActiveIcon className="w-5 h-5 text-gray-500" />
            <h1 className="text-lg font-semibold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                Ikke gemt
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Forhåndsvis
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2"
              style={{ 
                backgroundColor: hasChanges ? config.branding.colors.primary : undefined 
              }}
            >
              <Save className="w-4 h-4" />
              Gem ændringer
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'branding' && (
              <BrandingEditor 
                branding={config.branding} 
                onChange={(branding) => updateConfig({ branding })} 
              />
            )}
            {activeTab === 'colors' && (
              <ColorsEditor 
                colors={config.branding.colors} 
                onChange={(colors) => updateConfig({ branding: { ...config.branding, colors } })} 
              />
            )}
            {activeTab === 'images' && (
              <ImagesEditor 
                branding={config.branding} 
                onChange={(branding) => updateConfig({ branding })} 
              />
            )}
            {activeTab === 'hours' && (
              <HoursEditor 
                hours={config.businessHours} 
                onChange={(businessHours) => updateConfig({ businessHours })} 
              />
            )}
            {activeTab === 'contact' && (
              <ContactEditor 
                contact={config.contact} 
                onChange={(contact) => updateConfig({ contact })} 
              />
            )}
            {activeTab === 'menu' && (
              <MenuEditor 
                menu={config.menu} 
                onChange={(menu) => updateConfig({ menu })} 
                primaryColor={config.branding.colors.primary}
              />
            )}
            {activeTab === 'features' && (
              <FeaturesEditor 
                features={config.features} 
                onChange={(features) => updateConfig({ features })} 
              />
            )}
            {activeTab === 'social' && (
              <SocialEditor 
                social={config.contact.socialMedia} 
                onChange={(socialMedia) => updateConfig({ contact: { ...config.contact, socialMedia } })} 
              />
            )}
            {activeTab === 'delivery' && (
              <DeliveryEditor 
                delivery={config.delivery} 
                onChange={(delivery) => updateConfig({ delivery })} 
              />
            )}
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <PreviewModal 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        config={config}
      />
    </div>
  );
}
