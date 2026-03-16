import { Vendor, Report, AnalyticsData, VendorCategoryConfig } from './types';

export const VADODARA_PINCODES = [
  '390001', '390002', '390003', '390004', '390005', '390006', '390007', '390008', '390009', '390010',
  '390011', '390012', '390013', '390014', '390015', '390016', '390017', '390018', '390019', '390020',
  '390021', '390022', '390023', '390024', '390025', '390026', '390027', '390028', '390029', '390030',
  '391101', '391105', '391107', '391110', '391115', '391120', '391121', '391125', '391130', '391135',
  '391140', '391145', '391210', '391220', '391230', '391240', '391243', '391250', '391310', '391320',
  '391330', '391340', '391350', '391410', '391420', '391421', '391430', '391440', '391445', '391450',
  '391455', '391510', '391520', '391530', '391540', '391605', '391610', '391720', '391730', '391740',
  '391745', '391750', '391760', '391761', '391770', '391774', '391775', '391811', '391812', '391814',
  '391816', '391820', '391821', '391830', '391831', '391839', '392012', '392020', '393001', '393002'
];
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
    galleryImages: [
      { id: 'g1', vendorId: 'v1', imageUrl: 'https://picsum.photos/600/400?random=20', sortOrder: 0 },
      { id: 'g2', vendorId: 'v1', imageUrl: 'https://picsum.photos/600/400?random=21', sortOrder: 1 },
      { id: 'g3', vendorId: 'v1', imageUrl: 'https://picsum.photos/600/400?random=22', sortOrder: 2 },
      { id: 'g4', vendorId: 'v1', imageUrl: 'https://picsum.photos/600/400?random=23', sortOrder: 3 },
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
    planType: 'card_only',
    verified: true,
    galleryImages: [
      { id: 'g5', vendorId: 'v2', imageUrl: 'https://picsum.photos/600/400?random=30', sortOrder: 0 },
      { id: 'g6', vendorId: 'v2', imageUrl: 'https://picsum.photos/600/400?random=31', sortOrder: 1 },
      { id: 'g7', vendorId: 'v2', imageUrl: 'https://picsum.photos/600/400?random=32', sortOrder: 2 },
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
    galleryImages: [
      { id: 'g8', vendorId: 'v3', imageUrl: 'https://picsum.photos/600/400?random=24', sortOrder: 0 },
      { id: 'g9', vendorId: 'v3', imageUrl: 'https://picsum.photos/600/400?random=25', sortOrder: 1 },
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
    galleryImages: [
      { id: 'g10', vendorId: 'v4', imageUrl: 'https://picsum.photos/600/400?random=33', sortOrder: 0 },
      { id: 'g11', vendorId: 'v4', imageUrl: 'https://picsum.photos/600/400?random=34', sortOrder: 1 },
      { id: 'g12', vendorId: 'v4', imageUrl: 'https://picsum.photos/600/400?random=35', sortOrder: 2 },
      { id: 'g13', vendorId: 'v4', imageUrl: 'https://picsum.photos/600/400?random=36', sortOrder: 3 },
      { id: 'g14', vendorId: 'v4', imageUrl: 'https://picsum.photos/600/400?random=37', sortOrder: 4 },
    ]
  },
  {
    id: 'v-elec-1',
    name: 'Electrician - Harshil Solanki',
    shortDescription: 'Professional electrical services for home and office.',
    description: 'Expert electrician providing services for all your electrical needs, from repairs to new installations. Available for emergency calls.',
    city: 'Vadodara',
    category: 'Services',
    address: 'Pin Code: 391760, Vadodara',
    phone: '+91 97374 32384',
    email: 'harshil.solanki@example.com',
    coverImage: '/elc.jpg',
    isOpen: true,
    rating: 4.8,
    reviewCount: 42,
    isPremium: true,
    websiteUuid: 'uuid-elec-harshil',
    verified: true,
    products: [
      { id: 'p-e1', name: 'AC Installation/Repair', price: 1500, image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop', description: 'Air conditioning installation, service, and gas filling', category: 'Appliances' },
      { id: 'p-e2', name: 'Electrical Wiring', price: 500, image: 'https://plus.unsplash.com/premium_photo-1682144706912-88d447f5517f?q=80&w=2070&auto=format&fit=crop', description: 'Fault finding and complete house wiring solutions', category: 'Wiring' },
      { id: 'p-e3', name: 'Switchboard Fixing', price: 200, image: 'https://images.unsplash.com/photo-1596765796791-a1e6878b6672?q=80&w=2070&auto=format&fit=crop', description: 'Repairing or replacing electrical switches and sockets', category: 'Repairs' },
    ],
    galleryImages: [
      { id: 'g15', vendorId: 'v-elec-1', imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop', sortOrder: 0 }
    ],
  },
  {
    id: 'v-plumb-1',
    name: 'Plumber - Vinod bhai ',
    shortDescription: 'Reliable plumbing services and repairs.',
    description: 'Experienced plumber offering quick and efficient solutions for leaks, pipe fittings, and bathroom installations.',
    city: 'Vadodara',
    category: 'Services',
    address: 'Pin Code: 391760, Vadodara',
    phone: '+91 95864 53366',
    email: 'vinod.plumber@example.com',
    coverImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2070&auto=format&fit=crop',
    isOpen: true,
    rating: 4.6,
    reviewCount: 38,
    isPremium: true,
    websiteUuid: 'uuid-plumb-vinod',
    verified: true,
    products: [
      { id: 'p-pl1', name: 'Pipe Leakage Repair', price: 300, image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2070&auto=format&fit=crop', description: 'Fixing water leaks in bathroom and kitchen pipelines', category: 'Repairs' },
      { id: 'p-pl2', name: 'Tap/Faucet Change', price: 150, image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop', description: 'Installation of new sanitary ware and taps', category: 'Installation' },
      { id: 'p-pl3', name: 'Geyser Installation', price: 600, image: 'https://plus.unsplash.com/premium_photo-1681400685040-5e60d5b76615?q=80&w=2080&auto=format&fit=crop', description: 'Safe mounting and connection of water heaters', category: 'Appliances' },
    ],
    galleryImages: [
      { id: 'g16', vendorId: 'v-plumb-1', imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop', sortOrder: 0 }
    ],
  },
  {
    id: 'v-marble-1',
    name: 'Shreeji Marble Arts',
    shortDescription: 'Premium handcrafted marble articles and statues.',
    description: 'Discover elegance with our handcrafted marble products. We offer custom statues, home decor items, and architectural marble elements designed to perfection.',
    city: 'Ahmedabad',
    category: 'Decor',
    address: 'Sarkhej-Gandhinagar Highway, Ahmedabad',
    phone: '+91 98765 11111',
    email: 'contact@shreejimarble.com',
    coverImage: 'https://images.unsplash.com/photo-1584857187123-fadb717ce01d?q=80&w=2070&auto=format&fit=crop',
    isOpen: true,
    rating: 4.9,
    reviewCount: 156,
    isPremium: true,
    planType: 'card_website',
    websiteUuid: 'demo-uuid-v3',
    verified: true,
    products: [
      { id: 'p-m1', name: 'Marble Elephant Set', price: 4500, image: 'https://images.unsplash.com/photo-1541414777501-792773347f3e?q=80&w=2064&auto=format&fit=crop', description: 'Hand-carved marble elephants (Set of 2)', category: 'Statues' },
      { id: 'p-m2', name: 'Intricate Marble Tulsi Kyara', price: 12500, image: 'https://images.unsplash.com/photo-1610488052402-92144d034267?q=80&w=2102&auto=format&fit=crop', description: 'White Makrana marble Tulsi pot', category: 'Decor' },
      { id: 'p-m3', name: 'Marble Inlay Table Top', price: 28000, image: 'https://images.unsplash.com/photo-1605335198031-6e866e4a2e58?q=80&w=2050&auto=format&fit=crop', description: 'Pietra Dura floral inlay work', category: 'Furniture' },
      { id: 'p-m4', name: 'Buddha Head Bust', price: 8500, image: 'https://images.unsplash.com/photo-1534066060851-d96a77fbedca?q=80&w=2112&auto=format&fit=crop', description: 'Serene meditating Buddha statue', category: 'Statues' },
    ],
    galleryImages: [
      { id: 'g17', vendorId: 'v-marble-1', imageUrl: 'https://images.unsplash.com/photo-1586716402243-7b4d13e2f9d3?q=80&w=2071&auto=format&fit=crop', sortOrder: 0 },
      { id: 'g18', vendorId: 'v-marble-1', imageUrl: 'https://images.unsplash.com/photo-1574577189600-41ab64d0bb02?q=80&w=2074&auto=format&fit=crop', sortOrder: 1 },
      { id: 'g19', vendorId: 'v-marble-1', imageUrl: 'https://images.unsplash.com/photo-1632882830869-7da7a1bc7e20?q=80&w=2070&auto=format&fit=crop', sortOrder: 2 }
    ],
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
    // explore: "Explore Premium Collections",
    visitWebsite: "Website",
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
    listingOnly: "Listing Only",
  },
  hi: {
    searchPlaceholder: "आभूषण, सजावट खोजें...",
    // explore: "प्रीमियम संग्रह खोजें",
    visitWebsite: "वेबसाइट",
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
    listingOnly: "केवल लिस्टिंग",
  },
  gu: {
    searchPlaceholder: "જ્વેલરી, ડેકોર શોધો...",
    // explore: "પ્રીમિયમ કલેક્શન જુઓ",
    visitWebsite: "વેબસાઇટ",
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
    listingOnly: "માત્ર લિસ્ટિંગ",
  }
};