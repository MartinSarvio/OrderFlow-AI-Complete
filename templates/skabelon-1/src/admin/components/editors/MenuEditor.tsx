// Menu Editor Component
import { useState } from 'react';
import { 
  Utensils, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { MenuConfig, MenuCategory, MenuItem, ItemOption, ItemAddon } from '@/types';

interface MenuEditorProps {
  menu: MenuConfig;
  onChange: (menu: MenuConfig) => void;
  primaryColor: string;
}

export function MenuEditor({ menu, onChange, primaryColor }: MenuEditorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddCategory = (category: MenuCategory) => {
    const newCategory = {
      ...category,
      id: `cat_${Date.now()}`,
      sortOrder: menu.categories.length,
      items: [],
    };
    onChange({
      ...menu,
      categories: [...menu.categories, newCategory],
    });
    setIsAddingCategory(false);
    setExpandedCategories(prev => [...prev, newCategory.id]);
  };

  const handleUpdateCategory = (updatedCategory: MenuCategory) => {
    onChange({
      ...menu,
      categories: menu.categories.map(cat =>
        cat.id === updatedCategory.id ? updatedCategory : cat
      ),
    });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    onChange({
      ...menu,
      categories: menu.categories.filter(cat => cat.id !== categoryId),
    });
  };

  const handleAddItem = (item: MenuItem) => {
    if (!selectedCategoryId) return;
    
    const newItem: MenuItem = {
      ...item,
      id: `item_${Date.now()}`,
      categoryId: selectedCategoryId,
    };
    
    onChange({
      ...menu,
      categories: menu.categories.map(cat =>
        cat.id === selectedCategoryId
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      ),
    });
    setIsAddingItem(false);
  };

  const handleUpdateItem = (updatedItem: MenuItem) => {
    onChange({
      ...menu,
      categories: menu.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      })),
    });
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string, categoryId: string) => {
    onChange({
      ...menu,
      categories: menu.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      ),
    });
  };

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const index = menu.categories.findIndex(cat => cat.id === categoryId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === menu.categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...menu.categories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    
    onChange({
      ...menu,
      categories: newCategories.map((cat, i) => ({ ...cat, sortOrder: i })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Menu Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kategorier</p>
                <p className="text-2xl font-bold">{menu.categories.length}</p>
              </div>
              <Utensils className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Produkter</p>
                <p className="text-2xl font-bold">
                  {menu.categories.reduce((sum, cat) => sum + cat.items.length, 0)}
                </p>
              </div>
              <Tag className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Valuta</p>
                <p className="text-2xl font-bold">{menu.currency}</p>
              </div>
              <div className="text-2xl font-bold text-gray-300">kr</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Menu Kategorier
            </CardTitle>
            <CardDescription>
              Organiser din menu i kategorier
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsAddingCategory(true)}
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tilføj kategori
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {menu.categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen kategorier endnu</p>
              <p className="text-sm">Tilføj din første kategori for at komme i gang</p>
            </div>
          ) : (
            menu.categories.map((category, index) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 flex-1 text-left">
                        {expandedCategories.includes(category.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {category.items.length} produkter
                        </Badge>
                      </button>
                    </CollapsibleTrigger>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveCategory(category.id, 'up')}
                      >
                        <ChevronDown className="w-4 h-4 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === menu.categories.length - 1}
                        onClick={() => moveCategory(category.id, 'down')}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rediger
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Slet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Category Items */}
                  <CollapsibleContent>
                    <div className="p-4 border-t">
                      {category.items.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          Ingen produkter i denne kategori
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {category.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">{item.price} kr</p>
                                </div>
                                {!item.isAvailable && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                                    Udsolgt
                                  </Badge>
                                )}
                                {item.isPopular && (
                                  <Badge style={{ backgroundColor: primaryColor }}>
                                    Populær
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id, category.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setIsAddingItem(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tilføj produkt
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tilføj ny kategori</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleAddCategory}
            onCancel={() => setIsAddingCategory(false)}
            primaryColor={primaryColor}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rediger kategori</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdateCategory}
              onCancel={() => setEditingCategory(null)}
              primaryColor={primaryColor}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tilføj nyt produkt</DialogTitle>
          </DialogHeader>
          <ItemForm
            onSubmit={handleAddItem}
            onCancel={() => setIsAddingItem(false)}
            primaryColor={primaryColor}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger produkt</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              item={editingItem}
              onSubmit={handleUpdateItem}
              onCancel={() => setEditingItem(null)}
              primaryColor={primaryColor}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Category Form Component
interface CategoryFormProps {
  category?: MenuCategory;
  onSubmit: (category: MenuCategory) => void;
  onCancel: () => void;
  primaryColor: string;
}

function CategoryForm({ category, onSubmit, onCancel, primaryColor }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...category,
      id: category?.id || '',
      name,
      description,
      sortOrder: category?.sortOrder || 0,
      items: category?.items || [],
    } as MenuCategory);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Navn</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="f.eks. Pizza"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse (valgfri)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv kategorien..."
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuller
        </Button>
        <Button 
          type="submit"
          style={{ backgroundColor: primaryColor }}
        >
          {category ? 'Gem ændringer' : 'Tilføj kategori'}
        </Button>
      </div>
    </form>
  );
}

// Item Form Component
interface ItemFormProps {
  item?: MenuItem;
  onSubmit: (item: MenuItem) => void;
  onCancel: () => void;
  primaryColor: string;
}

function ItemForm({ item, onSubmit, onCancel, primaryColor }: ItemFormProps) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [image, setImage] = useState(item?.image || '');
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [isPopular, setIsPopular] = useState(item?.isPopular || false);
  const [isNew, setIsNew] = useState(item?.isNew || false);
  const [allergens, setAllergens] = useState<string[]>(item?.allergens || []);
  const tags: string[] = item?.tags || [];
  const options: ItemOption[] = item?.options || [];
  const addons: ItemAddon[] = item?.addons || [];

  const allergenOptions = ['Gluten', 'Lactose', 'Nødder', 'Skaldyr', 'Æg', 'Soja', 'Sesam', 'Sennep', 'Selleri', 'Sulfitter'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...item,
      id: item?.id || '',
      categoryId: item?.categoryId || '',
      name,
      description,
      price,
      image: image || undefined,
      isAvailable,
      isPopular,
      isNew,
      allergens,
      tags,
      options,
      addons,
    } as MenuItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">Navn *</Label>
          <Input
            id="itemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="f.eks. Margherita Pizza"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemDescription">Beskrivelse</Label>
          <Textarea
            id="itemDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv produktet..."
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="itemPrice">Pris (kr) *</Label>
            <Input
              id="itemPrice"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemImage">Billede URL</Label>
            <Input
              id="itemImage"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Status & Badges */}
      <div className="space-y-4">
        <Label>Status & Badges</Label>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <span className="text-sm">På lager</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isPopular}
              onCheckedChange={setIsPopular}
            />
            <span className="text-sm">Populær</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isNew}
              onCheckedChange={setIsNew}
            />
            <span className="text-sm">Nyhed</span>
          </div>
        </div>
      </div>

      {/* Allergens */}
      <div className="space-y-3">
        <Label>Allergener</Label>
        <div className="flex flex-wrap gap-2">
          {allergenOptions.map((allergen) => (
            <button
              key={allergen}
              type="button"
              onClick={() => {
                setAllergens(prev => 
                  prev.includes(allergen)
                    ? prev.filter(a => a !== allergen)
                    : [...prev, allergen]
                );
              }}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                allergens.includes(allergen)
                  ? 'border-2'
                  : 'border hover:bg-gray-50'
              }`}
              style={{
                borderColor: allergens.includes(allergen) ? primaryColor : undefined,
                backgroundColor: allergens.includes(allergen) ? `${primaryColor}15` : undefined,
                color: allergens.includes(allergen) ? primaryColor : undefined,
              }}
            >
              {allergen}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuller
        </Button>
        <Button 
          type="submit"
          style={{ backgroundColor: primaryColor }}
        >
          {item ? 'Gem ændringer' : 'Tilføj produkt'}
        </Button>
      </div>
    </form>
  );
}
