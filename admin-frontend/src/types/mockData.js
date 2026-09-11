export const initialMetalTypes = [
  { id: 1, name: '24K Yellow Gold', purity: 0.999, symbol: 'AU999', color: '#EAB308' },
  { id: 2, name: '22K Royal Gold', purity: 0.916, symbol: 'AU916', color: '#CA8A04' },
  { id: 3, name: '18K Yellow Gold', purity: 0.750, symbol: 'AU750', color: '#D4AF37' },
  { id: 4, name: '18K White Gold', purity: 0.750, symbol: 'WG750', color: '#E2E8F0' },
  { id: 5, name: '18K Rose Gold', purity: 0.750, symbol: 'RG750', color: '#FB7185' },
  { id: 6, name: 'Platinum 950', purity: 0.950, symbol: 'PT950', color: '#CBD5E1' },
  { id: 7, name: 'Sterling Silver 925', purity: 0.925, symbol: 'AG925', color: '#94A3B8' },
];

export const initialGoldRates = [
  { id: 1, metal_type_id: 1, name: '24K Yellow Gold', rate_per_gram: 85.50, buy_rate_per_gram: 81.20, change_24h: 1.25, effective_date: '2026-09-09' },
  { id: 2, metal_type_id: 2, name: '22K Royal Gold', rate_per_gram: 78.40, buy_rate_per_gram: 74.30, change_24h: 1.10, effective_date: '2026-09-09' },
  { id: 3, metal_type_id: 3, name: '18K Yellow Gold', rate_per_gram: 64.20, buy_rate_per_gram: 60.50, change_24h: 0.85, effective_date: '2026-09-09' },
  { id: 4, metal_type_id: 4, name: '18K White Gold', rate_per_gram: 65.50, buy_rate_per_gram: 61.20, change_24h: 0.90, effective_date: '2026-09-09' },
  { id: 5, metal_type_id: 5, name: '18K Rose Gold', rate_per_gram: 64.90, buy_rate_per_gram: 60.80, change_24h: 0.75, effective_date: '2026-09-09' },
  { id: 6, metal_type_id: 6, name: 'Platinum 950', rate_per_gram: 36.80, buy_rate_per_gram: 33.50, change_24h: -0.40, effective_date: '2026-09-09' },
  { id: 7, metal_type_id: 7, name: 'Sterling Silver 925', rate_per_gram: 1.15, buy_rate_per_gram: 0.98, change_24h: 0.20, effective_date: '2026-09-09' },
];

export const initialCategories = [
  { id: 1, name: 'Rings', icon: 'Sparkles', description: 'Solitaire, wedding bands, cocktail rings' },
  { id: 2, name: 'Necklaces & Chains', icon: 'Crown', description: 'Chokers, tennis necklaces, royal chains' },
  { id: 3, name: 'Bracelets & Bangles', icon: 'CircleDot', description: 'Tennis bracelets, solid gold bangles' },
  { id: 4, name: 'Earrings', icon: 'Gem', description: 'Studs, chandeliers, diamond drop hoops' },
  { id: 5, name: 'Pendants & Charms', icon: 'Shield', description: 'Diamond solitaires, spiritual pendants' },
];

export const initialGemstones = [
  { id: 1, name: 'Brilliant Diamond', code: 'DIA-001', type: 'Diamond', cut: 'Round Brilliant', clarity: 'VVS1', color: 'D (Colorless)', carat_weight: 1.20, price_per_carat: 4800, stock_qty: 14 },
  { id: 2, name: 'Royal Blue Sapphire', code: 'SAP-002', type: 'Sapphire', cut: 'Oval', clarity: 'Eye Clean', color: 'Cornflower Blue', carat_weight: 2.50, price_per_carat: 1850, stock_qty: 8 },
  { id: 3, name: 'Pigeon Blood Ruby', code: 'RUB-003', type: 'Ruby', cut: 'Cushion', clarity: 'VVS2', color: 'Deep Red', carat_weight: 1.75, price_per_carat: 3200, stock_qty: 5 },
  { id: 4, name: 'Colombian Emerald', code: 'EME-004', type: 'Emerald', cut: 'Emerald Cut', clarity: 'Minor Inclusions', color: 'Vivid Green', carat_weight: 2.10, price_per_carat: 2900, stock_qty: 6 },
];

export const initialProducts = [
  {
    id: 1,
    code_sku: 'RNG-24K-001',
    barcode: '89345001',
    name: 'Eternal Sovereign Diamond Solitaire Ring',
    category_id: 1,
    metal_type_id: 3, // 18K Yellow Gold
    net_weight: 5.40,
    gross_weight: 5.65,
    labor_cost: 140.00,
    markup_rate: 18.0,
    stock_qty: 6,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    gemstones: [
      { name: 'Center Diamond', carat: 1.0, type: 'Diamond', clarity: 'VVS1', color: 'E', value: 3800 }
    ],
    description: 'Masterfully crafted 18K yellow gold band with a certified center brilliant solitaire diamond.'
  },
  {
    id: 2,
    code_sku: 'NCK-18K-002',
    barcode: '89345002',
    name: 'Royal Heritage 24K Gold Filigree Necklace',
    category_id: 2,
    metal_type_id: 1, // 24K
    net_weight: 28.50,
    gross_weight: 28.50,
    labor_cost: 420.00,
    markup_rate: 15.0,
    stock_qty: 3,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    gemstones: [],
    description: 'High-purity 24K pure gold traditional filigree necklace, intricately hand-chiseled.'
  },
  {
    id: 3,
    code_sku: 'BRC-18K-003',
    barcode: '89345003',
    name: 'Luxe Tennis Bracelet with 4ct Pavé Diamonds',
    category_id: 3,
    metal_type_id: 4, // 18K White Gold
    net_weight: 12.80,
    gross_weight: 13.60,
    labor_cost: 380.00,
    markup_rate: 22.0,
    stock_qty: 4,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1611591475880-994bb0fd6300?auto=format&fit=crop&w=600&q=80',
    gemstones: [
      { name: '42 Natural Round Diamonds', carat: 4.0, type: 'Diamond', clarity: 'VS1', color: 'F', value: 4200 }
    ],
    description: 'Classically elegant 18K white gold tennis bracelet studded with 4 carats of brilliant pavé diamonds.'
  },
  {
    id: 4,
    code_sku: 'EAR-22K-004',
    barcode: '89345004',
    name: 'Imperial Emerald & Diamond Chandelier Earrings',
    category_id: 4,
    metal_type_id: 3, // 18K Yellow Gold
    net_weight: 8.90,
    gross_weight: 10.40,
    labor_cost: 260.00,
    markup_rate: 20.0,
    stock_qty: 2,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
    gemstones: [
      { name: 'Colombian Emerald Drops', carat: 2.2, type: 'Emerald', clarity: 'Vivid', color: 'Green', value: 2400 },
      { name: 'Accent Diamonds', carat: 0.8, type: 'Diamond', clarity: 'VVS2', color: 'G', value: 950 }
    ],
    description: 'Showstopping chandelier earrings featuring deep green Colombian emerald teardrops.'
  },
  {
    id: 5,
    code_sku: 'RNG-PT-005',
    barcode: '89345005',
    name: 'Celestial Sapphire Platinum 950 Ring',
    category_id: 1,
    metal_type_id: 6, // Platinum 950
    net_weight: 7.20,
    gross_weight: 7.90,
    labor_cost: 220.00,
    markup_rate: 19.0,
    stock_qty: 5,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
    gemstones: [
      { name: 'Ceylon Royal Sapphire', carat: 2.1, type: 'Sapphire', clarity: 'Eye-Clean', color: 'Royal Blue', value: 2600 }
    ],
    description: 'Heavy solid platinum 950 ring crowned with an unheated Ceylon royal blue sapphire.'
  },
  {
    id: 6,
    code_sku: 'BNG-24K-006',
    barcode: '89345006',
    name: 'Dragon & Phoenix 24K Gold Wedding Bangle',
    category_id: 3,
    metal_type_id: 1, // 24K Gold
    net_weight: 37.50, // 1 tael / ~37.5g
    gross_weight: 37.50,
    labor_cost: 490.00,
    markup_rate: 12.0,
    stock_qty: 2,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    gemstones: [],
    description: 'Auspicous 24K pure gold wedding bangle embossed with traditional dragon and phoenix motifs.'
  }
];

export const initialCustomers = [
  {
    id: 1,
    name: 'Victoria Sterling',
    phone: '+1 (555) 234-8901',
    email: 'v.sterling@luxemail.com',
    tier: 'Diamond VIP',
    discount_rate: 5.0,
    total_spent: 42800,
    loyalty_points: 1250,
    address: '880 5th Avenue, Suite 14B, New York, NY'
  },
  {
    id: 2,
    name: 'Arthur Pendelton',
    phone: '+1 (555) 890-1234',
    email: 'arthur.p@wealthgroup.org',
    tier: 'Platinum',
    discount_rate: 3.0,
    total_spent: 19400,
    loyalty_points: 580,
    address: '42 Regent Crescent, Beverly Hills, CA'
  },
  {
    id: 3,
    name: 'Elena Rostova',
    phone: '+1 (555) 762-9011',
    email: 'elena.rostova@designhaus.com',
    tier: 'Gold',
    discount_rate: 2.0,
    total_spent: 8600,
    loyalty_points: 240,
    address: '150 Palm Tree Way, Miami, FL'
  },
  {
    id: 4,
    name: 'Marcus Vance',
    phone: '+1 (555) 412-6789',
    email: 'mvance@investors.io',
    tier: 'Standard',
    discount_rate: 0.0,
    total_spent: 3200,
    loyalty_points: 90,
    address: '710 Market Street, San Francisco, CA'
  }
];

export const initialSales = [
  {
    id: 1,
    invoice_no: 'INV090820260001',
    customer_id: 1,
    customer_name: 'Victoria Sterling',
    user_name: 'Alexander Cross (Store Manager)',
    sale_date: '2026-09-08',
    items: [
      {
        product_name: 'Eternal Sovereign Diamond Solitaire Ring',
        code_sku: 'RNG-24K-001',
        qty: 1,
        weight_g: 5.40,
        metal_rate: 64.20,
        unit_price: 4560.00,
        total: 4560.00
      }
    ],
    total_amount: 4560.00,
    discount: 228.00, // 5% VIP discount
    tax: 346.56, // 8%
    grand_total: 4678.56,
    payment_method: 'Credit Card',
    payment_status: 'Paid'
  },
  {
    id: 2,
    invoice_no: 'INV090720260002',
    customer_id: 2,
    customer_name: 'Arthur Pendelton',
    user_name: 'Elena Vance (Cashier)',
    sale_date: '2026-09-07',
    items: [
      {
        product_name: 'Royal Heritage 24K Gold Filigree Necklace',
        code_sku: 'NCK-18K-002',
        qty: 1,
        weight_g: 28.50,
        metal_rate: 85.50,
        unit_price: 3350.00,
        total: 3350.00
      }
    ],
    total_amount: 3350.00,
    discount: 100.50,
    tax: 259.96,
    grand_total: 3509.46,
    payment_method: 'Bank Wire',
    payment_status: 'Paid'
  }
];

export const initialBuybacks = [
  {
    id: 1,
    buyback_no: 'BB-2026-0014',
    customer_name: 'Arthur Pendelton',
    customer_phone: '+1 (555) 890-1234',
    buyback_date: '2026-09-08',
    metal_name: '24K Yellow Gold',
    gross_weight: 15.20,
    melt_loss_pct: 2.0,
    net_weight: 14.90,
    buy_rate_per_gram: 81.20,
    appraisal_fee: 25.00,
    total_amount: 1184.88,
    status: 'Approved & Paid',
    payment_method: 'Cash',
    notes: 'Scrap gold pendant and old link chain, verified on XRF spectrometer.'
  },
  {
    id: 2,
    buyback_no: 'BB-2026-0013',
    customer_name: 'Elena Rostova',
    customer_phone: '+1 (555) 762-9011',
    buyback_date: '2026-09-05',
    metal_name: '18K Yellow Gold',
    gross_weight: 8.60,
    melt_loss_pct: 3.0,
    net_weight: 8.34,
    buy_rate_per_gram: 60.50,
    appraisal_fee: 15.00,
    total_amount: 489.57,
    status: 'Approved & Paid',
    payment_method: 'Store Credit',
    notes: 'Trade-in towards purchase of Luxe Tennis Bracelet.'
  }
];

export const initialSuppliers = [
  { id: 1, name: 'Valcambi Suisse Bullion Refinery', contact: 'Marc Weber', phone: '+41 91 695 55 55', email: 'supply@valcambi.ch', specialty: 'Fine Gold & Platinum Bars' },
  { id: 2, name: 'Antwerp Diamond Exchange Co.', contact: 'David Stern', phone: '+32 3 222 11 00', email: 'orders@antwerpdiamonds.eu', specialty: 'GIA Certified Loose Diamonds' },
  { id: 3, name: 'Bangkok Gemstone Consortium', contact: 'Somchai Prasert', phone: '+66 2 630 8800', email: 'trade@bkk-gems.co.th', specialty: 'Rubies, Emeralds & Sapphires' },
];
