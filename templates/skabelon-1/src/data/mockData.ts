// OrderFlow PWA Generator - Mock Data
import type { RestaurantConfig, Order, User, DashboardStats, Cart } from '@/types';

export const mockRestaurant: RestaurantConfig = {
  id: 'pizzeria-roma-001',
  subdomain: 'roma-pizza',
  branding: {
    name: 'Pizzeria Roma',
    shortName: 'Roma Pizza',
    slogan: 'Autentisk italiensk pizza siden 1985',
    description: 'Vi laver pizza med kærlighed og de bedste ingredienter fra Italien',
    logo: {
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
      darkUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop'
    },
    colors: {
      primary: '#D4380D',
      secondary: '#FFF7E6',
      accent: '#FFA940',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1A1A1A',
      textMuted: '#666666',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#F5222D'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    }
  },
  features: {
    ordering: true,
    loyalty: true,
    reservations: false,
    delivery: true,
    pickup: true,
    tableOrdering: false,
    pushNotifications: true,
    customerAccounts: true
  },
  menu: {
    currency: 'DKK',
    taxRate: 0.25,
    showPrices: true,
    allowCustomization: true,
    categories: [
      {
        id: 'cat-001',
        name: 'Pizza',
        description: 'Autentiske italienske pizzaer bagt i stenovn',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
        sortOrder: 1,
        items: [
          {
            id: 'item-001',
            name: 'Margherita',
            description: 'Tomatsauce, mozzarella, frisk basilikum og olivenolie',
            price: 85,
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
            categoryId: 'cat-001',
            tags: ['vegetar', 'klassiker'],
            allergens: ['gluten', 'laktose'],
            isAvailable: true,
            isPopular: true,
            options: [
              {
                id: 'opt-001',
                name: 'Størrelse',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-001', name: 'Normal', priceModifier: 0 },
                  { id: 'ch-002', name: 'Familie', priceModifier: 50 }
                ]
              },
              {
                id: 'opt-002',
                name: 'Dej',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-003', name: 'Klassisk', priceModifier: 0 },
                  { id: 'ch-004', name: 'Glutenfri', priceModifier: 15 }
                ]
              }
            ],
            addons: [
              { id: 'add-001', name: 'Ekstra ost', price: 15 },
              { id: 'add-002', name: 'Champignon', price: 10 },
              { id: 'add-003', name: 'Peperoni', price: 12 }
            ]
          },
          {
            id: 'item-002',
            name: 'Pepperoni',
            description: 'Tomatsauce, mozzarella og krydret pepperoni',
            price: 95,
            image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
            categoryId: 'cat-001',
            tags: ['kød', 'populær'],
            allergens: ['gluten', 'laktose'],
            isAvailable: true,
            isPopular: true,
            options: [
              {
                id: 'opt-001',
                name: 'Størrelse',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-001', name: 'Normal', priceModifier: 0 },
                  { id: 'ch-002', name: 'Familie', priceModifier: 55 }
                ]
              }
            ],
            addons: [
              { id: 'add-001', name: 'Ekstra ost', price: 15 },
              { id: 'add-004', name: 'Jalapeños', price: 10 }
            ]
          },
          {
            id: 'item-003',
            name: 'Quattro Formaggi',
            description: 'Fire slags ost: mozzarella, gorgonzola, parmesan og pecorino',
            price: 105,
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
            categoryId: 'cat-001',
            tags: ['vegetar', 'ost'],
            allergens: ['gluten', 'laktose'],
            isAvailable: true,
            isNew: true,
            options: [
              {
                id: 'opt-001',
                name: 'Størrelse',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-001', name: 'Normal', priceModifier: 0 },
                  { id: 'ch-002', name: 'Familie', priceModifier: 60 }
                ]
              }
            ],
            addons: [
              { id: 'add-001', name: 'Ekstra ost', price: 15 },
              { id: 'add-005', name: 'Honning', price: 8 }
            ]
          },
          {
            id: 'item-004',
            name: 'Diavola',
            description: 'Tomatsauce, mozzarella, krydret salami og chili',
            price: 98,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
            categoryId: 'cat-001',
            tags: ['kød', 'stærk'],
            allergens: ['gluten', 'laktose'],
            isAvailable: true,
            options: [
              {
                id: 'opt-001',
                name: 'Størrelse',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-001', name: 'Normal', priceModifier: 0 },
                  { id: 'ch-002', name: 'Familie', priceModifier: 55 }
                ]
              },
              {
                id: 'opt-003',
                name: 'Styrke',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-005', name: 'Mild', priceModifier: 0 },
                  { id: 'ch-006', name: 'Medium', priceModifier: 0 },
                  { id: 'ch-007', name: 'Hot', priceModifier: 0 }
                ]
              }
            ],
            addons: [
              { id: 'add-001', name: 'Ekstra ost', price: 15 },
              { id: 'add-004', name: 'Jalapeños', price: 10 }
            ]
          }
        ]
      },
      {
        id: 'cat-002',
        name: 'Pasta',
        description: 'Hjemmelavet pasta med autentiske italienske saucer',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop',
        sortOrder: 2,
        items: [
          {
            id: 'item-005',
            name: 'Spaghetti Carbonara',
            description: 'Spaghetti med æg, pancetta, parmesan og peber',
            price: 115,
            image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
            categoryId: 'cat-002',
            tags: ['kød', 'klassiker'],
            allergens: ['gluten', 'laktose', 'æg'],
            isAvailable: true,
            isPopular: true,
            options: [
              {
                id: 'opt-004',
                name: 'Størrelse',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-008', name: 'Normal', priceModifier: 0 },
                  { id: 'ch-009', name: 'Stor', priceModifier: 25 }
                ]
              }
            ],
            addons: [
              { id: 'add-006', name: 'Ekstra pancetta', price: 20 },
              { id: 'add-007', name: 'Parmesan', price: 15 }
            ]
          },
          {
            id: 'item-006',
            name: 'Penne Arrabbiata',
            description: 'Penne med krydret tomatsauce, hvidløg og chili',
            price: 95,
            image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop',
            categoryId: 'cat-002',
            tags: ['vegetar', 'vegansk', 'stærk'],
            allergens: ['gluten'],
            isAvailable: true,
            options: [
              {
                id: 'opt-004',
                name: 'Størrelse',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-008', name: 'Normal', priceModifier: 0 },
                  { id: 'ch-009', name: 'Stor', priceModifier: 20 }
                ]
              }
            ],
            addons: [
              { id: 'add-008', name: 'Ricotta', price: 15 }
            ]
          }
        ]
      },
      {
        id: 'cat-003',
        name: 'Drikkevarer',
        description: 'Forfriskende drikkevarer til din måltid',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop',
        sortOrder: 3,
        items: [
          {
            id: 'item-007',
            name: 'Coca-Cola',
            description: '33cl dåse',
            price: 25,
            image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop',
            categoryId: 'cat-003',
            tags: ['drikke', 'sodavand'],
            allergens: [],
            isAvailable: true,
            options: [
              {
                id: 'opt-005',
                name: 'Variant',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-010', name: 'Coca-Cola', priceModifier: 0 },
                  { id: 'ch-011', name: 'Coca-Cola Zero', priceModifier: 0 },
                  { id: 'ch-012', name: 'Fanta', priceModifier: 0 },
                  { id: 'ch-013', name: 'Sprite', priceModifier: 0 }
                ]
              }
            ],
            addons: []
          },
          {
            id: 'item-008',
            name: 'San Pellegrino',
            description: '50cl flaske med brus',
            price: 30,
            image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&h=300&fit=crop',
            categoryId: 'cat-003',
            tags: ['drikke', 'vand'],
            allergens: [],
            isAvailable: true,
            options: [],
            addons: [
              { id: 'add-009', name: 'Citron', price: 0 },
              { id: 'add-010', name: 'Lime', price: 0 }
            ]
          }
        ]
      },
      {
        id: 'cat-004',
        name: 'Dessert',
        description: 'Søde afslutninger på din måltid',
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
        sortOrder: 4,
        items: [
          {
            id: 'item-009',
            name: 'Tiramisu',
            description: 'Klassisk italiensk dessert med mascarpone og espresso',
            price: 55,
            image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
            categoryId: 'cat-004',
            tags: ['dessert', 'kaffe'],
            allergens: ['laktose', 'gluten', 'æg'],
            isAvailable: true,
            isPopular: true,
            options: [],
            addons: [
              { id: 'add-011', name: 'Ekstra kakao', price: 5 }
            ]
          },
          {
            id: 'item-010',
            name: 'Panna Cotta',
            description: 'Italiensk flødedessert med bærkompot',
            price: 50,
            image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
            categoryId: 'cat-004',
            tags: ['dessert', 'vegetar'],
            allergens: ['laktose'],
            isAvailable: true,
            isNew: true,
            options: [
              {
                id: 'opt-006',
                name: 'Topping',
                required: true,
                multiple: false,
                choices: [
                  { id: 'ch-014', name: 'Bærkompot', priceModifier: 0 },
                  { id: 'ch-015', name: 'Karamel', priceModifier: 0 },
                  { id: 'ch-016', name: 'Chokolade', priceModifier: 0 }
                ]
              }
            ],
            addons: []
          }
        ]
      }
    ]
  },
  contact: {
    address: 'Rådhusstræde 12',
    city: 'København',
    postalCode: '1466',
    phone: '+45 33 12 34 56',
    email: 'info@pizzeriaroma.dk',
    website: 'https://pizzeriaroma.dk',
    socialMedia: {
      facebook: 'https://facebook.com/pizzeriaroma',
      instagram: 'https://instagram.com/pizzeriaroma'
    }
  },
  businessHours: {
    timezone: 'Europe/Copenhagen',
    monday: { open: '11:00', close: '22:00', closed: false },
    tuesday: { open: '11:00', close: '22:00', closed: false },
    wednesday: { open: '11:00', close: '22:00', closed: false },
    thursday: { open: '11:00', close: '22:00', closed: false },
    friday: { open: '11:00', close: '23:00', closed: false },
    saturday: { open: '12:00', close: '23:00', closed: false },
    sunday: { open: '12:00', close: '21:00', closed: false }
  },
  payment: {
    methods: ['card', 'mobilepay', 'cash'],
    stripeEnabled: true,
    mobilePayEnabled: true,
    cashEnabled: true
  },
  delivery: {
    enabled: true,
    fee: 35,
    minimumOrder: 150,
    freeDeliveryThreshold: 300,
    estimatedTime: 45,
    zones: [
      {
        id: 'zone-001',
        name: 'Indre By',
        fee: 35,
        minimumOrder: 150,
        polygon: []
      },
      {
        id: 'zone-002',
        name: 'Vesterbro',
        fee: 45,
        minimumOrder: 200,
        polygon: []
      }
    ]
  },
  loyalty: {
    enabled: true,
    pointsPerCurrency: 1,
    welcomeBonus: 50,
    rewards: [
      {
        id: 'reward-001',
        name: 'Gratis Margherita',
        description: 'Få en gratis Margherita pizza',
        pointsCost: 500,
        freeItemId: 'item-001'
      },
      {
        id: 'reward-002',
        name: '10% Rabat',
        description: 'Få 10% rabat på din næste bestilling',
        pointsCost: 200,
        discountValue: 10,
        discountType: 'percentage'
      },
      {
        id: 'reward-003',
        name: '50 kr. Rabat',
        description: 'Få 50 kr. rabat på din næste bestilling',
        pointsCost: 300,
        discountValue: 50,
        discountType: 'fixed'
      }
    ]
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z'
};

export const mockUser: User = {
  id: 'user-001',
  phone: '+45 12 34 56 78',
  email: 'kunde@example.com',
  name: 'Anders Andersen',
  addresses: [
    {
      street: 'Nørrebrogade 45, 2. th.',
      city: 'København',
      postalCode: '2200',
      floor: '2',
      doorCode: '1234',
      notes: 'Ring på dørklokken'
    }
  ],
  favoriteRestaurants: ['pizzeria-roma-001'],
  orderHistory: ['order-001', 'order-002'],
  loyaltyPoints: {
    'pizzeria-roma-001': 125
  },
  createdAt: '2024-01-10T08:00:00Z'
};

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    restaurantId: 'pizzeria-roma-001',
    customer: {
      id: 'user-001',
      name: 'Anders Andersen',
      phone: '+45 12 34 56 78',
      email: 'kunde@example.com',
      address: {
        street: 'Nørrebrogade 45, 2. th.',
        city: 'København',
        postalCode: '2200',
        floor: '2',
        doorCode: '1234',
        notes: 'Ring på dørklokken'
      },
      loyaltyPoints: 125
    },
    items: [
      {
        id: 'order-item-001',
        menuItemId: 'item-001',
        name: 'Margherita',
        price: 85,
        quantity: 1,
        options: [
          {
            optionId: 'opt-001',
            optionName: 'Størrelse',
            choices: [
              { choiceId: 'ch-001', choiceName: 'Normal', priceModifier: 0 }
            ]
          }
        ],
        addons: [
          { addonId: 'add-001', addonName: 'Ekstra ost', price: 15 }
        ],
        totalPrice: 100
      },
      {
        id: 'order-item-002',
        menuItemId: 'item-007',
        name: 'Coca-Cola',
        price: 25,
        quantity: 2,
        options: [],
        addons: [],
        totalPrice: 50
      }
    ],
    type: 'delivery',
    status: 'delivered',
    payment: {
      method: 'mobilepay',
      status: 'completed',
      transactionId: 'mp-123456',
      paidAt: '2024-01-25T18:30:00Z'
    },
    totals: {
      subtotal: 150,
      tax: 37.5,
      deliveryFee: 35,
      discount: 0,
      total: 185
    },
    createdAt: '2024-01-25T18:15:00Z',
    updatedAt: '2024-01-25T19:00:00Z'
  }
];

export const mockDashboardStats: DashboardStats = {
  todayOrders: 23,
  todayRevenue: 4850,
  activeOrders: 5,
  totalCustomers: 156,
  popularItems: [
    { itemId: 'item-001', name: 'Margherita', totalOrdered: 45, revenue: 3825 },
    { itemId: 'item-002', name: 'Pepperoni', totalOrdered: 38, revenue: 3610 },
    { itemId: 'item-005', name: 'Spaghetti Carbonara', totalOrdered: 22, revenue: 2530 }
  ],
  recentOrders: mockOrders,
  weeklyRevenue: [
    { date: '2024-01-19', revenue: 3200, orders: 18 },
    { date: '2024-01-20', revenue: 4100, orders: 22 },
    { date: '2024-01-21', revenue: 3800, orders: 20 },
    { date: '2024-01-22', revenue: 2900, orders: 16 },
    { date: '2024-01-23', revenue: 3500, orders: 19 },
    { date: '2024-01-24', revenue: 4200, orders: 24 },
    { date: '2024-01-25', revenue: 4850, orders: 23 }
  ]
};

export const emptyCart: Cart = {
  items: [],
  restaurantId: 'pizzeria-roma-001',
  type: 'delivery',
  address: undefined,
  scheduledFor: undefined,
  notes: '',
  tip: 0,
  loyaltyDiscount: 0
};
