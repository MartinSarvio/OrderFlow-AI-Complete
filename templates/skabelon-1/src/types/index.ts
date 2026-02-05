// OrderFlow PWA Generator - Type Definitions

// Restaurant Configuration
export interface RestaurantConfig {
  id: string;
  subdomain: string;
  branding: BrandingConfig;
  features: FeatureFlags;
  menu: MenuConfig;
  contact: ContactInfo;
  businessHours: BusinessHours;
  payment: PaymentConfig;
  delivery: DeliveryConfig;
  loyalty?: LoyaltyConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingConfig {
  name: string;
  shortName: string;
  slogan?: string;
  description?: string;
  logo: {
    url: string;
    darkUrl?: string;
  };
  heroImage?: string;
  favicon?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export interface FeatureFlags {
  ordering: boolean;
  loyalty: boolean;
  reservations: boolean;
  delivery: boolean;
  pickup: boolean;
  tableOrdering: boolean;
  pushNotifications: boolean;
  customerAccounts: boolean;
}

export interface MenuConfig {
  categories: MenuCategory[];
  currency: string;
  taxRate: number;
  showPrices: boolean;
  allowCustomization: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  categoryId: string;
  tags: string[];
  allergens: string[];
  isAvailable: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  options?: ItemOption[];
  addons?: ItemAddon[];
}

export interface ItemOption {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  choices: OptionChoice[];
}

export interface OptionChoice {
  id: string;
  name: string;
  priceModifier: number;
}

export interface ItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface ContactInfo {
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface BusinessHours {
  timezone: string;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  holidays?: HolidayHours[];
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface HolidayHours {
  date: string;
  name: string;
  hours: DayHours;
}

export interface PaymentConfig {
  methods: PaymentMethod[];
  stripeEnabled: boolean;
  mobilePayEnabled: boolean;
  cashEnabled: boolean;
}

export type PaymentMethod = 'card' | 'mobilepay' | 'cash' | 'applepay' | 'googlepay';

export interface DeliveryConfig {
  enabled: boolean;
  fee: number;
  minimumOrder: number;
  freeDeliveryThreshold?: number;
  estimatedTime: number;
  zones: DeliveryZone[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minimumOrder: number;
  polygon: [number, number][];
}

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerCurrency: number;
  welcomeBonus: number;
  rewards: LoyaltyReward[];
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountValue?: number;
  discountType?: 'fixed' | 'percentage';
  freeItemId?: string;
}

// Order Types
export interface Order {
  id: string;
  restaurantId: string;
  customer: CustomerInfo;
  items: OrderItem[];
  type: 'delivery' | 'pickup' | 'table';
  status: OrderStatus;
  payment: PaymentInfo;
  totals: OrderTotals;
  scheduledFor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: DeliveryAddress;
  loyaltyPoints?: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  floor?: string;
  doorCode?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options: SelectedOption[];
  addons: SelectedAddon[];
  notes?: string;
  totalPrice: number;
}

export interface SelectedOption {
  optionId: string;
  optionName: string;
  choices: SelectedChoice[];
}

export interface SelectedChoice {
  choiceId: string;
  choiceName: string;
  priceModifier: number;
}

export interface SelectedAddon {
  addonId: string;
  addonName: string;
  price: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface PaymentInfo {
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  tip?: number;
  total: number;
}

// Cart Types
export interface Cart {
  items: CartItem[];
  restaurantId: string;
  type: 'delivery' | 'pickup' | 'table';
  address?: DeliveryAddress;
  scheduledFor?: string;
  notes?: string;
  tip?: number;
  loyaltyDiscount?: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  options: SelectedOption[];
  addons: SelectedAddon[];
  notes?: string;
}

// User Types
export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  addresses: DeliveryAddress[];
  favoriteRestaurants: string[];
  orderHistory: string[];
  loyaltyPoints: Record<string, number>;
  pushToken?: string;
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  totalCustomers: number;
  popularItems: PopularItem[];
  recentOrders: Order[];
  weeklyRevenue: DailyRevenue[];
}

export interface PopularItem {
  itemId: string;
  name: string;
  totalOrdered: number;
  revenue: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

// PWA Types
export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui';
  background_color: string;
  theme_color: string;
  icons: PWAIcon[];
  orientation: 'portrait' | 'landscape';
  scope: string;
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

// Notification Types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  image?: string;
  data?: Record<string, unknown>;
  sentAt: string;
  target: 'all' | 'customers' | 'segment';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Theme Types
export interface Theme {
  colors: BrandingConfig['colors'];
  fonts: BrandingConfig['fonts'];
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
