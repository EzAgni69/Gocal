import { Vendor, Report, AnalyticsData, VendorCategoryConfig } from './types';

export const CITIES = ['Mumbai', 'Ahmedabad', 'Delhi', 'Surat', 'Bangalore', 'Vadodara'];
export const CATEGORIES = ['Jewelry', 'Fashion', 'Decor', 'Electronics', 'Services', 'Fruits & Vegetables', 'Grocery'];
export const UNIT_OPTIONS = ['kg', 'g', 'pieces', 'dozen', 'liters', 'ml', 'box', 'packet'];

export const VENDOR_CATEGORY_CONFIG: Record<string, VendorCategoryConfig> = {
  'Jewelry': {
    requiresImage: true,
    showQuantity: false,
    showUnit: false,
    showMinOrder: false,
    showSku: true,
    showDescription: true
  },
  'Fashion': {
    requiresImage: true,
    showQuantity: true,
    showUnit: false,
    showMinOrder: false,
    showSku: true,
    showDescription: true
  },
  'Fruits & Vegetables': {
    requiresImage: false,
    showQuantity: true,
    showUnit: true,
    defaultUnit: 'kg',
    showMinOrder: true,
    showSku: false,
    showDescription: false
  },
  'Grocery': {
    requiresImage: false,
    showQuantity: true,
    showUnit: true,
    defaultUnit: 'kg',
    showMinOrder: true,
    showSku: false,
    showDescription: false
  },
  'Services': {
    requiresImage: false,
    showQuantity: false,
    showUnit: false,
    showMinOrder: false,
    showSku: false,
    showDescription: true
  },
  'Electronics': {
    requiresImage: true,
    showQuantity: true,
    showUnit: false,
    showMinOrder: false,
    showSku: true,
    showDescription: true
  },
  'Decor': {
    requiresImage: true,
    showQuantity: true,
    showUnit: false,
    showMinOrder: false,
    showSku: true,
    showDescription: true
  },
};

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Royal Heritage Jewelry',
    shortDescription: 'Exquisite handcrafted gold and diamond jewelry.',
    description: 'Royal Heritage Jewelry brings you a legacy of 50 years in crafting the finest gold, diamond, and polki jewelry. Our designs blend traditional artistry with modern elegance.',
    city: 'Ahmedabad',
    category: 'Jewelry',
    address: '12, Palace Road, Navrangpura, Ahmedabad',
    phone: '+91 98765 43210',
    email: 'contact@royalheritage.com',
    coverImage: 'https://picsum.photos/800/600?random=1',
    isOpen: true,
    rating: 4.8,
    reviewCount: 124,
    isPremium: true,
    websiteUuid: 'uuid-royal-heritage',
    verified: true,
    products: [
      { id: 'p1', name: 'Kundan Necklace Set', price: 150000, image: 'https://picsum.photos/400/400?random=10', description: '22k Gold Kundan set', category: 'Necklace' },
      { id: 'p2', name: 'Diamond Solitaire Ring', price: 45000, image: 'https://picsum.photos/400/400?random=11', description: '18k White Gold', category: 'Rings' },
      { id: 'p3', name: 'Antique Gold Bangles', price: 85000, image: 'https://picsum.photos/400/400?random=12', description: 'Temple jewelry design', category: 'Bangles' },
    ],
    gallery: [
      'https://picsum.photos/600/400?random=20',
      'https://picsum.photos/600/400?random=21',
      'https://picsum.photos/600/400?random=22',
      'https://picsum.photos/600/400?random=23',
    ],
    offers: [
      { title: 'Diwali Dhamaka', code: 'DIWALI20', discount: '20% Off Making Charges' }
    ]
  },
  {
    id: 'v2',
    name: 'Urban Chic Boutique',
    shortDescription: 'Contemporary fashion for the modern woman.',
    description: 'Trendsetting styles curated from around the globe. We specialize in sustainable fabrics and chic cuts.',
    city: 'Mumbai',
    category: 'Fashion',
    address: 'Shop 4, Bandra West, Mumbai',
    phone: '+91 99887 76655',
    email: 'info@urbanchic.com',
    coverImage: 'https://picsum.photos/800/600?random=2',
    isOpen: true,
    rating: 4.2,
    reviewCount: 45,
    isPremium: false, // Standard vendor
    verified: true,
    gallery: [
      'https://picsum.photos/600/400?random=30',
      'https://picsum.photos/600/400?random=31',
      'https://picsum.photos/600/400?random=32',
    ],
  },
  {
    id: 'v3',
    name: 'Elite Home Decor',
    shortDescription: 'Luxury furniture and art pieces.',
    description: 'Transform your home into a palace with our curated selection of imported furniture and hand-painted art.',
    city: 'Delhi',
    category: 'Decor',
    address: 'GK II, New Delhi',
    phone: '+91 11223 34455',
    email: 'sales@elitehome.com',
    coverImage: 'https://picsum.photos/800/600?random=3',
    isOpen: false,
    rating: 4.9,
    reviewCount: 210,
    isPremium: true,
    websiteUuid: 'uuid-elite-decor',
    verified: true,
    products: [
      { id: 'p4', name: 'Persian Rug', price: 25000, image: 'https://picsum.photos/400/400?random=13', description: 'Hand-knotted wool', category: 'Rugs' },
      { id: 'p5', name: 'Crystal Chandelier', price: 12000, image: 'https://picsum.photos/400/400?random=14', description: 'Bohemian crystal', category: 'Lighting' },
    ],
    gallery: [
      'https://picsum.photos/600/400?random=24',
      'https://picsum.photos/600/400?random=25',
    ],
    offers: []
  },
  {
    id: 'v4',
    name: 'Fresh Farms',
    shortDescription: 'Organic fruits and vegetables direct from farmers.',
    description: 'We bring the freshest organic produce directly from local farms to your table.',
    city: 'Bangalore',
    category: 'Fruits & Vegetables',
    address: 'Sector 4, HSR Layout, Bangalore',
    phone: '+91 98765 12345',
    email: 'fresh@farms.com',
    coverImage: 'https://picsum.photos/800/600?random=4',
    isOpen: true,
    rating: 4.5,
    reviewCount: 88,
    isPremium: false,
    verified: true,
    products: [
      { id: 'p6', name: 'Alphonso Mangoes', price: 1200, unit: 'dozen', quantity: 50, category: 'Fruits', inStock: true },
      { id: 'p7', name: 'Organic Spinach', price: 40, unit: 'kg', quantity: 20, category: 'Vegetables', inStock: true },
    ],
    gallery: [
      'https://picsum.photos/600/400?random=33',
      'https://picsum.photos/600/400?random=34',
      'https://picsum.photos/600/400?random=35',
      'https://picsum.photos/600/400?random=36',
      'https://picsum.photos/600/400?random=37',
    ]
  }
];

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', vendorName: 'Fake Watch Store', vendorId: 'v99', reason: 'Fraud', status: 'Pending', reportedBy: 'user_1' },
  { id: 'r2', vendorName: 'Spammy Services', vendorId: 'v98', reason: 'Spam', status: 'Resolved', reportedBy: 'user_2' },
];

export const MOCK_ANALYTICS: AnalyticsData[] = [
  { name: 'Mon', visits: 120, clicks: 45, favorites: 10 },
  { name: 'Tue', visits: 150, clicks: 55, favorites: 12 },
  { name: 'Wed', visits: 180, clicks: 60, favorites: 15 },
  { name: 'Thu', visits: 140, clicks: 50, favorites: 8 },
  { name: 'Fri', visits: 220, clicks: 80, favorites: 25 },
  { name: 'Sat', visits: 300, clicks: 110, favorites: 40 },
  { name: 'Sun', visits: 350, clicks: 130, favorites: 55 },
];

export const TRANSLATIONS = {
  en: {
    searchPlaceholder: "Search for jewelry, decor...",
    explore: "Explore Premium Collections",
    visitWebsite: "Visit Website",
    callNow: "Call Now",
    open: "Open Now",
    closed: "Closed",
    dashboard: "Dashboard",
    products: "Products",
    analytics: "Analytics",
    settings: "Settings",
    wishlist: "Wishlist",
    addToWishlist: "Add to Wishlist",
    sendInquiry: "Send Inquiry",
  },
  hi: {
    searchPlaceholder: "आभूषण, सजावट खोजें...",
    explore: "प्रीमियम संग्रह खोजें",
    visitWebsite: "वेबसाइट पर जाएं",
    callNow: "अभी कॉल करें",
    open: "खुला है",
    closed: "बंद है",
    dashboard: "डैशबोर्ड",
    products: "उत्पाद",
    analytics: "एनालिटिक्स",
    settings: "सेटिंग्स",
    wishlist: "इच्छा सूची",
    addToWishlist: "इच्छा सूची में डालें",
    sendInquiry: "पूछताछ भेजें",
  },
  gu: {
    searchPlaceholder: "જ્વેલરી, ડેકોર શોધો...",
    explore: "પ્રીમિયમ કલેક્શન જુઓ",
    visitWebsite: "વેબસાઇટની મુલાકાત લો",
    callNow: "હમણાં કોલ કરો",
    open: "ખુલ્લું છે",
    closed: "બંધ છે",
    dashboard: "ડેશબોર્ડ",
    products: "ઉત્પાદનો",
    analytics: "એનાલિટિક્સ",
    settings: "સેટિંગ્સ",
    wishlist: "વિશલિસ્ટ",
    addToWishlist: "વિશલિસ્ટમાં ઉમેરો",
    sendInquiry: "પૂછપરછ મોકલો",
  }
};