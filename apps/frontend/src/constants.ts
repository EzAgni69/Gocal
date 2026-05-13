import { Report, VendorCategoryConfig } from './types';

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

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', vendorName: 'Fake Watch Store', vendorId: 'v99', reason: 'Fraud', status: 'Pending', reportedBy: 'user_1' },
  { id: 'r2', vendorName: 'Spammy Services', vendorId: 'v98', reason: 'Spam', status: 'Resolved', reportedBy: 'user_2' },
];

export const TRANSLATIONS = {
  en: {
    searchPlaceholder: "Search by name, city, contact...",
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
    searchPlaceholder: "नाम, शहर, संपर्क से खोजें...",
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
    searchPlaceholder: "નામ, શહેર, સંપર્ક દ્વારા શોધો...",
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