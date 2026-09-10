import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const resources = {
  en: {
    translation: {
      // General & Brand
      brand: {
        name: 'JewelFlow',
        subtitle: 'Atelier Gold & Bullion Management',
        location: 'Phnom Penh • Atelier Studio',
        tagline: 'Luxury Jewelry ERP & POS Atelier',
        erp: 'ERP',
        suite: 'Atelier & Retail Suite',
      },
      // Navigation
      nav: {
        dashboard: 'Dashboard Overview',
        catalog: 'Jewelry Catalog',
        pos: 'POS Sales Terminal',
        gemstones: 'Gemstones Vault',
        goldRates: 'Daily Metal Fix',
        buybacks: 'Scrap Gold Buybacks',
        customers: 'Clientèle CRM',
        suppliers: 'Suppliers Directory',
        openPos: 'Open POS Terminal',
        searchPlaceholder: 'Search catalog, SKU, customer or invoice...',
        cambodianFix: 'Spot & Cambodian Gold Fix',
        londonFix: 'London Fix: Today',
        operations: 'Store Operations',
        vaultStock: 'Vault Metal Stock',
        audited: 'Audited',
        estValuation: 'Est. Valuation:',
        backendReady: 'Backend Sync Ready',
        adminRole: 'Master Jeweler / Admin',
        storeAlerts: 'Store Alerts',
        updates: 'updates',
        allAlertsCleared: 'All alerts cleared',
        marketTickerFootnote: '1 Chi = 3.75g | 1 Damlung = 37.5g',
        cambodiaExchange: 'Live Rate: 1 USD = 4,100 KHR',
      },
      // Cambodian Gold Measurements
      cambodiaGold: {
        title: 'Cambodian Gold Measurement Standards',
        khmerTitle: 'Cambodian Gold Weight Standards',
        troyOunce: 'Troy Ounce',
        gram: 'Gram',
        chi: 'Chi',
        damlung: 'Damlung',
        hun: 'Hun',
        troyOunceDesc: '1 oz t = 31.1035 grams',
        chiDesc: '1 Chi = 3.75 grams',
        damlungDesc: '1 Damlung = 37.5 grams (10 Chi)',
        hunDesc: '1 Hun = 0.375 grams (1/10 Chi)',
        pricePerGram: 'Price per Gram',
        pricePerChi: 'Price per Chi',
        pricePerDamlung: 'Price per Damlung',
        formulaGram: 'Spot / 31.1035',
        formulaChi: 'Price/g × 3.75',
        formulaDamlung: 'Price/Chi × 10',
        calculatorTitle: 'Cambodian Gold Calculator',
        calculatorSubtitle: 'Instantly value gold weight in Chi, Damlung, or Grams',
        weightAmount: 'Weight Amount',
        unitLabel: 'Unit',
        goldPurityLabel: 'Gold Purity',
        netGrams: 'Net Grams',
        inChi: 'In Chi',
        inDamlung: 'In Damlung',
        calculatedValuation: 'Calculated Metal Valuation',
        copyQuote: 'Copy Cambodian Quotation',
        copiedSuccess: 'Quotation Copied!',
        exchangeNotice: 'Live Exchange: 1 USD = 4,100 KHR',
        refreshRates: 'Refresh Metal Rates',
        lastUpdated: 'Last updated',
      },
      // Purities
      purity: {
        p24k: '24K Pure Bullion (99.9%)',
        p22k: '22K Crown Gold (91.6%)',
        p21k: '21K Arabic Gold (87.5%)',
        p18k: '18K Italian Fine Jewelry (75.0%)',
        p14k: '14K Commercial Gold (58.3%)',
        p10k: '10K Standard Gold (41.7%)',
      },
      // Catalog & Inventory
      catalog: {
        title: 'Jewelry & Bullion Catalog Table',
        subtitle: 'Full inventory ledger with weights, craftsmanship charges, and live valuations',
        piece: 'Jewelry Piece',
        skuBarcode: 'SKU & Barcode',
        category: 'Category',
        metalPurity: 'Metal & Purity',
        netWeight: 'Net Wt.',
        laborFee: 'Labor Fee',
        markup: 'Markup',
        livePrice: 'Live Atelier Price',
        stock: 'Stock',
        actions: 'Actions',
        addPiece: 'Add Jewelry Piece',
        allCategories: 'All Categories',
        allMetals: 'All Metal Purities',
        searchItem: 'Search SKU, name, or barcode...',
        inStock: 'pcs in stock',
        lowStock: 'Low Stock',
        itemsRegistered: 'registered items',
      },
      // POS & Sales
      pos: {
        title: 'Atelier Point of Sale Terminal',
        subtitle: 'Live re-priced inventory, barcoding, and automated bullion valuation tickets',
        searchPlaceholder: 'Scan barcode or search jewelry item...',
        selectClient: 'Select Customer Clientèle',
        walkInGuest: 'Walk-in Guest',
        orderSummary: 'Order Summary',
        subtotal: 'Metal & Labor Subtotal',
        vipDiscount: 'VIP Privilege Discount',
        tax: 'Sales Tax',
        grandTotal: 'Grand Total',
        processPayment: 'Complete & Print Invoice',
        emptyCart: 'No jewelry items in register. Select pieces from inventory grid.',
        itemAdded: 'added to register cart.',
        paymentSuccess: 'Sale completed successfully!',
        paymentMethod: 'Payment Method',
        cash: 'Cash',
        creditCard: 'Credit Card',
        khqr: 'KHQR / Bakong',
        printReceipt: 'Print Atelier Invoice',
        addToRegister: 'Add to Cart',
      },
      // Dashboard
      dashboard: {
        welcome: 'Welcome to JewelFlow Atelier',
        welcomeSubtitle: 'Live gold rate re-pricing enabled. Track fine jewelry inventory, bullion weight, customer trade-ins, and high-value sales.',
        totalRevenue: 'Total Revenue',
        goldInVault: 'Gold in Vault',
        avgTicket: 'Average Ticket',
        scrapBuybacks: 'Scrap Buybacks',
        quickEstimator: 'Quick Atelier Price Estimator',
        recentSales: 'Recent Atelier Sales',
        lowStockAlert: 'Low Stock Warning',
        allStockHealthy: 'All inventory items are well-stocked.',
        viewAll: 'View All',
      },
      // Customers CRM
      customers: {
        title: 'Clientèle & VIP Privilege CRM Table',
        subtitle: 'Client register with VIP tier privileges, loyalty points accrual, and purchase history',
        portfolio: 'Total Client Portfolio',
        enrollClient: 'Enroll Client',
        clientName: 'Client Name',
        contact: 'Contact Info',
        tier: 'VIP Tier',
        totalSpent: 'Total Spent',
        actions: 'Actions',
        searchPlaceholder: 'Search client name, phone or email...',
        totalClients: 'total clients',
      },
      // Suppliers
      suppliers: {
        title: 'Suppliers & Bullion Refineries',
        subtitle: 'Manage trusted bullion dealers, casting houses, and certified gem merchants',
        addSupplier: 'Add Supplier',
        company: 'Company Name',
        contactPerson: 'Contact Person',
        specialty: 'Specialty',
        phone: 'Phone',
        email: 'Email',
        balance: 'Outstanding Balance',
        searchPlaceholder: 'Search supplier company, contact or email...',
      },
      // Gemstones Vault
      gemstones: {
        title: 'Gemstones & Diamond Vault',
        subtitle: 'Certified loose diamonds, natural rubies, sapphires and emeralds with carat grading',
        addGem: 'Register Loose Gem',
        gemName: 'Gemstone & Cut',
        carat: 'Carat Weight',
        clarity: 'Clarity Grade',
        color: 'Color Grade',
        origin: 'Origin',
        cost: 'Vault Valuation',
        searchPlaceholder: 'Search gemstones by name, certificate or cut...',
      },
      // Buybacks
      buybacks: {
        title: 'Scrap Gold Buybacks & Trade-ins',
        subtitle: 'Trade-in processing with live gold scrap testing, net bullion weight, and cash payouts',
        newBuyback: 'New Scrap Buyback',
        customer: 'Customer',
        metalType: 'Metal Purity',
        netWeight: 'Tested Weight (g)',
        chiWeight: 'Weight in Chi',
        payout: 'Cash Payout',
        date: 'Transaction Date',
        status: 'Purity Tested',
        searchPlaceholder: 'Search buybacks by invoice, customer or metal...',
      },
      // Common / Actions
      common: {
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        search: 'Search',
        filter: 'Filter',
        confirm: 'Confirm',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        showing: 'Showing',
        to: 'to',
        of: 'of',
        results: 'results',
        perPage: 'per page',
        page: 'Page',
        loading: 'Loading...',
        usd: 'USD ($)',
        khr: 'KHR',
        language: 'Language',
        english: 'English',
        khmer: 'Khmer',
      },
    },
  },
  km: {
    translation: {
      // General & Brand
      brand: {
        name: 'JewelFlow',
        subtitle: 'ប្រព័ន្ធគ្រប់គ្រងហាងមាស និងគ្រឿងអលង្ការ',
        location: 'រាជធានីភ្នំពេញ • សិក្ខាសាលាមាស',
        tagline: 'ប្រព័ន្ធគ្រប់គ្រងហាងមាស និងគិតប្រាក់លំដាប់ខ្ពស់',
        erp: 'ERP',
        suite: 'កម្មវិធីគ្រប់គ្រងហាងមាស',
      },
      // Navigation
      nav: {
        dashboard: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
        catalog: 'កាតាឡុកគ្រឿងអលង្ការ',
        pos: 'ប្រព័ន្ធគិតប្រាក់ (POS)',
        gemstones: 'ឃ្លាំងត្បូងពេជ្រ',
        goldRates: 'តម្លៃមាសប្រចាំថ្ងៃ',
        buybacks: 'ទិញមាសចាស់ចូល',
        customers: 'បញ្ជីអតិថិជន CRM',
        suppliers: 'អ្នកផ្គត់ផ្គង់មាស',
        openPos: 'បើកផ្ទាំងលក់ POS',
        searchPlaceholder: 'ស្វែងរកកាតាឡុក កូដទំនិញ អតិថិជន ឬវិក្កយបត្រ...',
        cambodianFix: 'តម្លៃមាសទីផ្សារ និងខ្នាតខ្មែរ (ខ្នាតជី)',
        londonFix: 'ផ្សារអន្តរជាតិ London: ថ្ងៃនេះ',
        operations: 'ប្រតិបត្តិការហាង',
        vaultStock: 'ស្តុកមាសក្នុងឃ្លាំង',
        audited: 'បានផ្ទៀងផ្ទាត់',
        estValuation: 'តម្លៃប៉ាន់ស្មាន៖',
        backendReady: 'ភ្ជាប់ប្រព័ន្ធរួចរាល់',
        adminRole: 'អ្នកជំនាញមាស / រដ្ឋបាល',
        storeAlerts: 'ការជូនដំណឹងហាង',
        updates: 'ដំណឹងថ្មី',
        allAlertsCleared: 'មិនមានការជូនដំណឹងថ្មីទេ',
        marketTickerFootnote: '១ ជី = ៣.៧៥ ក្រាម | ១ តម្លឹង = ៣៧.៥ ក្រាម',
        cambodiaExchange: 'អត្រាទីផ្សារ: ១ ដុល្លារ = ៤,១០០ រៀល',
      },
      // Cambodian Gold Measurements
      cambodiaGold: {
        title: 'ខ្នាតរង្វាស់ទម្ងន់មាសខ្មែរ',
        khmerTitle: 'ខ្នាតទម្ងន់មាសខ្មែរ',
        troyOunce: 'Troy Ounce (អោនស៍)',
        gram: 'ក្រាម (Gram)',
        chi: 'ជី (Chi)',
        damlung: 'តម្លឹង (Damlung)',
        hun: 'ហ៊ុន (Hun)',
        troyOunceDesc: '១ អោនស៍ = ៣១.១០៣៥ ក្រាម',
        chiDesc: '១ ជី = ៣.៧៥ ក្រាម',
        damlungDesc: '១ តម្លឹង = ៣៧.៥ ក្រាម (១០ ជី)',
        hunDesc: '១ ហ៊ុន = ០.៣៧៥ ក្រាម (១/១០ ជី)',
        pricePerGram: 'តម្លៃក្នុង ១ ក្រាម',
        pricePerChi: 'តម្លៃក្នុង ១ ជី',
        pricePerDamlung: 'តម្លៃក្នុង ១ តម្លឹង',
        formulaGram: 'តម្លៃ Spot / ៣១.១០៣៥',
        formulaChi: 'តម្លៃ ១ក្រាម × ៣.៧៥',
        formulaDamlung: 'តម្លៃ ១ជី × ១០',
        calculatorTitle: 'ម៉ាស៊ីនគណនាតម្លៃមាសខ្នាតខ្មែរ',
        calculatorSubtitle: 'គណនាតម្លៃមាសភ្លាមៗជា ជី តម្លឹង ឬក្រាម តាមតម្លៃទីផ្សារផ្ទាល់',
        weightAmount: 'បរិមាណទម្ងន់',
        unitLabel: 'ខ្នាតទម្ងន់',
        goldPurityLabel: 'ទឹកមាស (កម្រិតសុទ្ធ)',
        netGrams: 'ទម្ងន់គិតជាក្រាម',
        inChi: 'គិតជាជី',
        inDamlung: 'គិតជាតម្លឹង',
        calculatedValuation: 'តម្លៃសរុបនៃការវាយតម្លៃ',
        copyQuote: 'ចម្លងតម្លៃសម្រង់មាស',
        copiedSuccess: 'បានចម្លងតម្លៃសម្រង់ជោគជ័យ!',
        exchangeNotice: 'អត្រាប្តូរប្រាក់: ១ ដុល្លារ = ៤,១០០ រៀល',
        refreshRates: 'ផ្ទុកតម្លៃមាសឡើងវិញ',
        lastUpdated: 'បានធ្វើបច្ចុប្បន្នភាព',
      },
      // Purities
      purity: {
        p24k: 'មាសសុទ្ធ ២៤K (ទឹក ៩៩.៩%)',
        p22k: 'មាស ២២K (ទឹក ៩១.៦%)',
        p21k: 'មាស ២១K (ទឹក ៨៧.៥%)',
        p18k: 'មាសអ៊ីតាលី ១៨K (ទឹក ៧៥.០%)',
        p14k: 'មាស ១៤K (ទឹក ៥៨.៣%)',
        p10k: 'មាស ១០K (ទឹក ៤១.៧%)',
      },
      // Catalog & Inventory
      catalog: {
        title: 'តារាងកាតាឡុកគ្រឿងអលង្ការ & មាសដុំ',
        subtitle: 'បញ្ជីស្តុកពេញលេញជាមួយទម្ងន់ ថ្លៃឈ្នួល និងការគណនាតម្លៃបច្ចុប្បន្ន',
        piece: 'គ្រឿងអលង្ការ',
        skuBarcode: 'កូដទំនិញ & បាកូដ',
        category: 'ប្រភេទគ្រឿង',
        metalPurity: 'ប្រភេទមាស & ទឹក',
        netWeight: 'ទម្ងន់សុទ្ធ',
        laborFee: 'ថ្លៃឈ្នួល',
        markup: 'ភាគរយចំណេញ',
        livePrice: 'តម្លៃលក់បច្ចុប្បន្ន',
        stock: 'ស្តុក',
        actions: 'សកម្មភាព',
        addPiece: 'បន្ថែមគ្រឿងអលង្ការថ្មី',
        allCategories: 'គ្រប់ប្រភេទគ្រឿង',
        allMetals: 'គ្រប់កម្រិតទឹកមាស',
        searchItem: 'ស្វែងរកឈ្មោះ កូដ ឬបាកូដ...',
        inStock: 'គ្រឿងក្នុងស្តុក',
        lowStock: 'ស្តុកជិតអស់',
        itemsRegistered: 'ទំនិញបានចុះបញ្ជី',
      },
      // POS & Sales
      pos: {
        title: 'ប្រព័ន្ធគិតប្រាក់ និងលក់រាយ (POS)',
        subtitle: 'គណនាតម្លៃតាមទីផ្សារស្វ័យប្រវត្តិ ស្កេនបាកូដ និងបោះពុម្ពវិក្កយបត្រ',
        searchPlaceholder: 'ស្កេនបាកូដ ឬវាយឈ្មោះគ្រឿងអលង្ការ...',
        selectClient: 'ជ្រើសរើសអតិថិជន',
        walkInGuest: 'ភ្ញៀវទូទៅ (មិនទាន់ចុះឈ្មោះ)',
        orderSummary: 'សង្ខេបការបញ្ជាទិញ',
        subtotal: 'តម្លៃមាស & ថ្លៃឈ្នួលសរុប',
        vipDiscount: 'ការបញ្ចុះតម្លៃពិសេស VIP',
        tax: 'ពន្ធលើការលក់',
        grandTotal: 'ទឹកប្រាក់សរុបចុងក្រោយ',
        processPayment: 'គិតប្រាក់ និងបោះពុម្ពវិក្កយបត្រ',
        emptyCart: 'មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ។ សូមជ្រើសរើសទំនិញពីបញ្ជីស្តុក។',
        itemAdded: 'ត្រូវបានបញ្ចូលទៅក្នុងកន្ត្រក។',
        paymentSuccess: 'ការលក់ត្រូវបានបញ្ចប់ដោយជោគជ័យ!',
        paymentMethod: 'វិធីសាស្ត្រទូទាត់ប្រាក់',
        cash: 'សាច់ប្រាក់សុទ្ធ (Cash)',
        creditCard: 'កាតធនាគារ (Card)',
        khqr: 'បាគង KHQR',
        printReceipt: 'បោះពុម្ពវិក្កយបត្រ',
        addToRegister: 'ដាក់ចូលកន្ត្រក',
      },
      // Dashboard
      dashboard: {
        welcome: 'សូមស្វាគមន៍មកកាន់ JewelFlow Atelier',
        welcomeSubtitle: 'ប្រព័ន្ធគណនាតម្លៃមាសបច្ចុប្បន្នស្វ័យប្រវត្តិ។ តាមដានស្តុកគ្រឿងអលង្ការ ទម្ងន់មាស ការទិញមាសចាស់ និងការលក់ប្រចាំថ្ងៃ។',
        totalRevenue: 'ចំណូលសរុប',
        goldInVault: 'មាសក្នុងឃ្លាំង',
        avgTicket: 'តម្លៃលក់មធ្យម',
        scrapBuybacks: 'ទិញមាសចាស់សរុប',
        quickEstimator: 'ម៉ាស៊ីនប៉ាន់ស្មានតម្លៃរហ័ស',
        recentSales: 'ការលក់ថ្មីៗ',
        lowStockAlert: 'ការដាស់តឿនស្តុកជិតអស់',
        allStockHealthy: 'ទំនិញទាំងអស់មានក្នុងស្តុកគ្រប់គ្រាន់។',
        viewAll: 'មើលទាំងអស់',
      },
      // Customers CRM
      customers: {
        title: 'បញ្ជីអតិថិជន និងសមាជិក VIP CRM',
        subtitle: 'បញ្ជីឈ្មោះអតិថិជន កម្រិត VIP ពិន្ទុសន្សំ និងប្រវត្តិទិញទំនិញ',
        portfolio: 'ផលប័ត្រអតិថិជនសរុប',
        enrollClient: 'ចុះឈ្មោះអតិថិជនថ្មី',
        clientName: 'ឈ្មោះអតិថិជន',
        contact: 'ទំនាក់ទំនង',
        tier: 'កម្រិត VIP',
        totalSpent: 'ទឹកប្រាក់ទិញសរុប',
        actions: 'សកម្មភាព',
        searchPlaceholder: 'ស្វែងរកឈ្មោះអតិថិជន លេខទូរស័ព្ទ ឬអ៊ីមែល...',
        totalClients: 'អតិថិជនសរុប',
      },
      // Suppliers
      suppliers: {
        title: 'បញ្ជីអ្នកផ្គត់ផ្គង់មាស និងត្បូង',
        subtitle: 'គ្រប់គ្រងទំនាក់ទំនងអ្នកផ្គត់ផ្គង់មាសសុទ្ធ និងរោងចក្រច្នៃត្បូង',
        addSupplier: 'បន្ថែមអ្នកផ្គត់ផ្គង់',
        company: 'ក្រុមហ៊ុន/ហាង',
        contactPerson: 'អ្នកទំនាក់ទំនង',
        specialty: 'ជំនាញផ្គត់ផ្គង់',
        phone: 'លេខទូរស័ព្ទ',
        email: 'អ៊ីមែល',
        balance: 'សមតុល្យជំពាក់',
        searchPlaceholder: 'ស្វែងរកឈ្មោះក្រុមហ៊ុន អ្នកទំនាក់ទំនង ឬអ៊ីមែល...',
      },
      // Gemstones Vault
      gemstones: {
        title: 'ឃ្លាំងត្បូងពេជ្រ និងត្បូងមានតម្លៃ',
        subtitle: 'ត្បូងពេជ្រធម្មជាតិ ត្បូងទទឹម និងត្បូងកណ្តៀងដែលបានបញ្ជាក់គុណភាពតាមកម្រិតការ៉ាត់',
        addGem: 'ចុះបញ្ជីត្បូងថ្មី',
        gemName: 'ឈ្មោះត្បូង & ទម្រង់កាត់',
        carat: 'ទម្ងន់ការ៉ាត់ (ct)',
        clarity: 'ភាពច្បាស់ (Clarity)',
        color: 'ពណ៌ (Color)',
        origin: 'ប្រភពដើម',
        cost: 'តម្លៃវាយតម្លៃ',
        searchPlaceholder: 'ស្វែងរកត្បូងតាមឈ្មោះ វិញ្ញាបនបត្រ ឬទម្រង់...',
      },
      // Buybacks
      buybacks: {
        title: 'ទិញមាសចាស់ចូល និងផ្លាស់ប្តូរ',
        subtitle: 'ទិញមាសចាស់ ថ្លឹងទម្ងន់ គិតជាខ្នាតជី និងតម្លឹង និងគណនាតម្លៃភ្លាមៗ',
        newBuyback: 'បង្កើតប័ណ្ណទិញចូលថ្មី',
        customer: 'អតិថិជន',
        metalType: 'ប្រភេទមាស/ទឹក',
        netWeight: 'ទម្ងន់ថ្លឹង (ក្រាម)',
        chiWeight: 'ទម្ងន់ជា ជី',
        payout: 'ប្រាក់ត្រូវទូទាត់',
        date: 'កាលបរិច្ឆេទ',
        status: 'ស្ថានភាពតេស្តទឹក',
        searchPlaceholder: 'ស្វែងរកប័ណ្ណទិញចូល តាមឈ្មោះអតិថិជន ឬកូដ...',
      },
      // Common / Actions
      common: {
        edit: 'កែប្រែ',
        delete: 'លុប',
        save: 'រក្សាទុក',
        cancel: 'បោះបង់',
        close: 'បិទ',
        search: 'ស្វែងរក',
        filter: 'ចម្រោះ',
        confirm: 'បញ្ជាក់',
        status: 'ស្ថានភាព',
        active: 'សកម្ម',
        inactive: 'អសកម្ម',
        showing: 'បង្ហាញពី',
        to: 'ដល់',
        of: 'នៃ',
        results: 'លទ្ធផល',
        perPage: 'ក្នុងមួយទំព័រ',
        page: 'ទំព័រ',
        loading: 'កំពុងដំណើរការ...',
        usd: 'ដុល្លារ ($)',
        khr: 'រៀល (៛)',
        language: 'ភាសា',
        english: 'English',
        khmer: 'ខ្មែរ (Khmer)',
      },
    },
  },
};

// Determine initial language: Default to 'km' (Khmer) unless user explicitly chose otherwise
const initialLanguage = (() => {
  if (typeof window !== 'undefined') {
    const explicitChoice = localStorage.getItem('jewelflow_lang_user_choice');
    if (explicitChoice === 'en') return 'en';
    if (explicitChoice === 'km') return 'km';
    // Universal Khmer default
    localStorage.setItem('i18nextLng', 'km');
    return 'km';
  }
  return 'km';
})();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'km',
    lng: initialLanguage,
    supportedLngs: ['en', 'km'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

const updateHtmlLang = (lng) => {
  if (typeof document !== 'undefined') {
    const isKhmer = lng && lng.startsWith('km');
    document.documentElement.lang = isKhmer ? 'km' : 'en';
    if (isKhmer) {
      document.documentElement.classList.add('lang-km');
    } else {
      document.documentElement.classList.remove('lang-km');
    }
  }
};

i18n.on('languageChanged', (lng) => {
  updateHtmlLang(lng);
});

// Force update HTML lang tag immediately
updateHtmlLang(i18n.language || initialLanguage);

export default i18n;
