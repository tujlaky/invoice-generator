import type { FormatSettings } from "@/lib/format.ts";

export type CountryCode = "NL" | "US" | "HU";

export type TaxOption = {
  value: string;
  // Shown in editor dropdowns.
  label: string;
  // Shown in document tax columns, e.g. "21%" or "Taxable".
  shortLabel: string;
  rate: number;
  exempt?: boolean;
  // Letter printed next to receipt lines where the country uses one (HU).
  receiptCode?: string;
};

export type Party = {
  name: string;
  address: string;
  postalCity: string;
  country: string;
  email: string;
  taxId: string;
  registrationId: string;
  bankAccount: string;
};

export type DemoItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode: string;
};

export type Shop = {
  name: string;
  address: string;
  postalCity: string;
  phone: string;
  website: string;
  taxId: string;
  registrationId: string;
};

export type CountryProfile = {
  code: CountryCode;
  name: string;
  format: FormatSettings;
  taxName: string;
  taxOptions: TaxOption[];
  defaultTaxCode: string;
  party: {
    taxIdLabel: string;
    registrationLabel: string | null;
    bankLabel: string;
    // Whether the customer's tax id is collected and printed.
    customerTaxId: boolean;
  };
  invoice: {
    title: string;
    fileName: string;
    // Hungarian invoices carry a per-rate summary table (adóalap / áfa / bruttó).
    taxTable: { rate: string; base: string; tax: string; gross: string } | null;
    labels: {
      from: string;
      billTo: string;
      details: string;
      number: string;
      issueDate: string;
      performanceDate: string | null;
      dueDate: string;
      paymentTerm: string;
      reference: string;
      description: string;
      quantity: string;
      unitPrice: string;
      tax: string;
      amount: string;
      subtotal: string;
      exempt: string;
      total: string;
      notes: string;
      page: (current: number, total: number) => string;
      continued: string;
    };
    demo: {
      number: string;
      dueDays: number;
      paymentTerm: string;
      reference: string;
      notes: string;
      seller: Party;
      customer: Party;
      items: DemoItem[];
      pool: DemoItem[];
    };
  };
  receipt: {
    title: string;
    fileName: string;
    // Consumer prices include tax (NL, HU) or tax is added at the bottom (US).
    pricesIncludeTax: boolean;
    paymentMethods: string[];
    cashMethod: string;
    labels: {
      number: string;
      register: string;
      cashier: string;
      date: string;
      time: string;
      total: string;
      paidWith: string;
      received: string;
      change: string;
      subtotal: string;
      taxSummary: string;
      rate: string;
      net: string;
      tax: string;
      gross: string;
      pricesNote: string;
      shopTaxId: string;
      shopRegistration: string | null;
    };
    footerLines: string[];
    demo: {
      number: string;
      register: string;
      cashier: string;
      footer: string;
      shop: Shop;
      items: DemoItem[];
      pool: DemoItem[];
    };
  };
};

const netherlands: CountryProfile = {
  code: "NL",
  name: "Netherlands",
  format: { locale: "nl-NL", currency: "EUR" },
  taxName: "Btw",
  taxOptions: [
    { value: "21", label: "21% btw", shortLabel: "21%", rate: 0.21 },
    { value: "9", label: "9% btw", shortLabel: "9%", rate: 0.09 },
    { value: "0", label: "0% btw", shortLabel: "0%", rate: 0 },
    {
      value: "exempt",
      label: "Vrijgesteld",
      shortLabel: "Vrijgesteld",
      rate: 0,
      exempt: true,
    },
  ],
  defaultTaxCode: "21",
  party: {
    taxIdLabel: "Btw-nummer",
    registrationLabel: "KvK",
    bankLabel: "IBAN",
    customerTaxId: true,
  },
  invoice: {
    title: "Factuur",
    fileName: "factuur",
    taxTable: null,
    labels: {
      from: "Van",
      billTo: "Factuur aan",
      details: "Factuurgegevens",
      number: "Factuurnummer",
      issueDate: "Factuurdatum",
      performanceDate: null,
      dueDate: "Vervaldatum",
      paymentTerm: "Betalingstermijn",
      reference: "Referentie",
      description: "Omschrijving",
      quantity: "Aantal",
      unitPrice: "Prijs",
      tax: "Btw",
      amount: "Totaal",
      subtotal: "Subtotaal",
      exempt: "Vrijgesteld",
      total: "Totaal",
      notes: "Notitie",
      page: (current, total) => `Pagina ${current} van ${total}`,
      continued: "Vervolg",
    },
    demo: {
      number: "2026-001",
      dueDays: 14,
      paymentTerm: "14 dagen",
      reference: "Websiteproject",
      notes:
        "Gelieve het totaalbedrag te voldoen onder vermelding van het factuurnummer.",
      seller: {
        name: "Studio Voorbeeld B.V.",
        address: "Keizersgracht 100",
        postalCity: "1015 CV Amsterdam",
        country: "Nederland",
        email: "facturen@voorbeeld.nl",
        taxId: "NL123456789B01",
        registrationId: "12345678",
        bankAccount: "NL91 ABNA 0417 1643 00",
      },
      customer: {
        name: "Klant Bedrijf B.V.",
        address: "Coolsingel 42",
        postalCity: "3011 AD Rotterdam",
        country: "Nederland",
        email: "administratie@klant.nl",
        taxId: "NL987654321B01",
        registrationId: "",
        bankAccount: "",
      },
      items: [
        {
          description: "Ontwerp en ontwikkeling",
          quantity: 1,
          unitPrice: 1250,
          taxCode: "21",
        },
        { description: "Drukwerk", quantity: 2, unitPrice: 85, taxCode: "9" },
      ],
      pool: [
        {
          description: "Webhosting (per maand)",
          quantity: 12,
          unitPrice: 14.95,
          taxCode: "21",
        },
        {
          description: "Domeinregistratie .nl",
          quantity: 1,
          unitPrice: 12.5,
          taxCode: "21",
        },
        {
          description: "Logo-ontwerp",
          quantity: 1,
          unitPrice: 650,
          taxCode: "21",
        },
        {
          description: "Huisstijlhandboek",
          quantity: 1,
          unitPrice: 480,
          taxCode: "21",
        },
        {
          description: "Visitekaartjes (250 stuks)",
          quantity: 1,
          unitPrice: 45,
          taxCode: "9",
        },
        {
          description: "Flyers A5 (500 stuks)",
          quantity: 1,
          unitPrice: 78,
          taxCode: "9",
        },
        {
          description: "Consultancy (per uur)",
          quantity: 8,
          unitPrice: 95,
          taxCode: "21",
        },
        {
          description: "Projectmanagement (per uur)",
          quantity: 6,
          unitPrice: 85,
          taxCode: "21",
        },
        {
          description: "SEO-optimalisatie",
          quantity: 1,
          unitPrice: 375,
          taxCode: "21",
        },
        {
          description: "Contentschrijven (per pagina)",
          quantity: 5,
          unitPrice: 60,
          taxCode: "21",
        },
        {
          description: "Fotografie op locatie",
          quantity: 1,
          unitPrice: 425,
          taxCode: "21",
        },
        {
          description: "Beeldbewerking (per foto)",
          quantity: 20,
          unitPrice: 7.5,
          taxCode: "21",
        },
        {
          description: "Nieuwsbriefsjabloon",
          quantity: 1,
          unitPrice: 290,
          taxCode: "21",
        },
        {
          description: "Socialmedia-beheer (per maand)",
          quantity: 3,
          unitPrice: 350,
          taxCode: "21",
        },
        {
          description: "Onderhoudscontract website",
          quantity: 1,
          unitPrice: 199,
          taxCode: "21",
        },
        {
          description: "SSL-certificaat (per jaar)",
          quantity: 1,
          unitPrice: 49,
          taxCode: "21",
        },
        {
          description: "Vertaling NL-EN (per woord)",
          quantity: 1500,
          unitPrice: 0.12,
          taxCode: "21",
        },
        {
          description: "Redactie en correctie",
          quantity: 3,
          unitPrice: 55,
          taxCode: "21",
        },
        {
          description: "Boek (paperback)",
          quantity: 10,
          unitPrice: 19.95,
          taxCode: "9",
        },
        { description: "E-book", quantity: 25, unitPrice: 9.99, taxCode: "9" },
        {
          description: "Tijdschriftabonnement",
          quantity: 1,
          unitPrice: 59,
          taxCode: "9",
        },
        {
          description: "Koffiebonen 1 kg",
          quantity: 4,
          unitPrice: 22.5,
          taxCode: "9",
        },
        {
          description: "Catering lunch (per persoon)",
          quantity: 12,
          unitPrice: 14.5,
          taxCode: "9",
        },
        {
          description: "Bloemen ontvangstbalie",
          quantity: 2,
          unitPrice: 35,
          taxCode: "9",
        },
        {
          description: "Workshop UX-design",
          quantity: 1,
          unitPrice: 890,
          taxCode: "21",
        },
        {
          description: "Training presenteren (dag)",
          quantity: 1,
          unitPrice: 1150,
          taxCode: "21",
        },
        {
          description: "Cursus Nederlands (10 lessen)",
          quantity: 1,
          unitPrice: 420,
          taxCode: "exempt",
        },
        {
          description: "Bijles wiskunde (per uur)",
          quantity: 6,
          unitPrice: 45,
          taxCode: "exempt",
        },
        {
          description: "Fysiotherapie (per behandeling)",
          quantity: 4,
          unitPrice: 38,
          taxCode: "exempt",
        },
        {
          description: "Verzekeringsadvies",
          quantity: 1,
          unitPrice: 150,
          taxCode: "exempt",
        },
        {
          description: "Export levering naar Duitsland",
          quantity: 1,
          unitPrice: 2400,
          taxCode: "0",
        },
        {
          description: "Intracommunautaire dienst",
          quantity: 1,
          unitPrice: 1800,
          taxCode: "0",
        },
        {
          description: "Reiskosten (per km)",
          quantity: 120,
          unitPrice: 0.23,
          taxCode: "21",
        },
        {
          description: "Parkeerkosten",
          quantity: 3,
          unitPrice: 12,
          taxCode: "21",
        },
        {
          description: "Laptopstandaard",
          quantity: 2,
          unitPrice: 39.95,
          taxCode: "21",
        },
        {
          description: "Bureaustoel ergonomisch",
          quantity: 1,
          unitPrice: 349,
          taxCode: "21",
        },
        {
          description: "Softwarelicentie (per jaar)",
          quantity: 5,
          unitPrice: 120,
          taxCode: "21",
        },
        {
          description: "Backupopslag 1 TB (per maand)",
          quantity: 12,
          unitPrice: 8.95,
          taxCode: "21",
        },
        {
          description: "Ontwerp en ontwikkeling",
          quantity: 1,
          unitPrice: 1250,
          taxCode: "21",
        },
        { description: "Drukwerk", quantity: 2, unitPrice: 85, taxCode: "9" },
      ],
    },
  },
  receipt: {
    title: "Kassabon",
    fileName: "bon",
    pricesIncludeTax: true,
    paymentMethods: ["PIN", "Contant", "iDEAL", "Creditcard"],
    cashMethod: "Contant",
    labels: {
      number: "Bon",
      register: "Kassa",
      cashier: "Medewerker",
      date: "Datum",
      time: "Tijd",
      total: "Totaal",
      paidWith: "Betaald met",
      received: "Ontvangen",
      change: "Wisselgeld",
      subtotal: "Subtotaal",
      taxSummary: "Btw-overzicht",
      rate: "Tarief",
      net: "Netto",
      tax: "Btw",
      gross: "Bruto",
      pricesNote: "Prijzen inclusief btw",
      shopTaxId: "Btw",
      shopRegistration: "KvK",
    },
    footerLines: [],
    demo: {
      number: "2026-000481",
      register: "3",
      cashier: "Sanne",
      footer:
        "Bedankt voor uw aankoop! Ruilen of retourneren kan binnen 14 dagen op vertoon van deze bon.",
      shop: {
        name: "Buurtsuper De Linde",
        address: "Lindenstraat 12",
        postalCity: "3512 AB Utrecht",
        phone: "030 123 45 67",
        website: "www.buurtsuperdelinde.nl",
        taxId: "NL001234567B01",
        registrationId: "87654321",
      },
      items: [
        {
          description: "Halfvolle melk 1 l",
          quantity: 2,
          unitPrice: 1.19,
          taxCode: "9",
        },
        {
          description: "Volkorenbrood",
          quantity: 1,
          unitPrice: 2.79,
          taxCode: "9",
        },
        {
          description: "Afwasmiddel 500 ml",
          quantity: 1,
          unitPrice: 1.99,
          taxCode: "21",
        },
      ],
      pool: [
        {
          description: "Halfvolle melk 1 l",
          quantity: 1,
          unitPrice: 1.19,
          taxCode: "9",
        },
        {
          description: "Volkorenbrood",
          quantity: 1,
          unitPrice: 2.79,
          taxCode: "9",
        },
        {
          description: "Jong belegen kaas 500 g",
          quantity: 1,
          unitPrice: 6.49,
          taxCode: "9",
        },
        {
          description: "Bananen (per kg)",
          quantity: 1.2,
          unitPrice: 1.89,
          taxCode: "9",
        },
        {
          description: "Snelfilterkoffie 500 g",
          quantity: 1,
          unitPrice: 7.99,
          taxCode: "9",
        },
        {
          description: "Pindakaas 350 g",
          quantity: 1,
          unitPrice: 2.59,
          taxCode: "9",
        },
        {
          description: "Appels Elstar 1 kg",
          quantity: 1,
          unitPrice: 2.99,
          taxCode: "9",
        },
        {
          description: "Scharreleieren 10 st",
          quantity: 1,
          unitPrice: 3.29,
          taxCode: "9",
        },
        {
          description: "Roomboter 250 g",
          quantity: 2,
          unitPrice: 2.49,
          taxCode: "9",
        },
        {
          description: "Mineraalwater 1,5 l",
          quantity: 2,
          unitPrice: 0.95,
          taxCode: "9",
        },
        {
          description: "Kipfilet 500 g",
          quantity: 1,
          unitPrice: 6.29,
          taxCode: "9",
        },
        {
          description: "Chocoladereep 100 g",
          quantity: 3,
          unitPrice: 1.49,
          taxCode: "9",
        },
        {
          description: "Paracetamol 500 mg 20 st",
          quantity: 1,
          unitPrice: 1.79,
          taxCode: "9",
        },
        {
          description: "Tijdschrift",
          quantity: 1,
          unitPrice: 6.95,
          taxCode: "9",
        },
        {
          description: "Boeket tulpen",
          quantity: 1,
          unitPrice: 4.99,
          taxCode: "9",
        },
        {
          description: "Pils 6 x 33 cl",
          quantity: 1,
          unitPrice: 5.99,
          taxCode: "21",
        },
        {
          description: "Rode wijn 75 cl",
          quantity: 1,
          unitPrice: 8.49,
          taxCode: "21",
        },
        {
          description: "Shampoo 300 ml",
          quantity: 1,
          unitPrice: 4.29,
          taxCode: "21",
        },
        {
          description: "Tandpasta 75 ml",
          quantity: 2,
          unitPrice: 2.19,
          taxCode: "21",
        },
        {
          description: "Batterijen AA 4 st",
          quantity: 1,
          unitPrice: 5.49,
          taxCode: "21",
        },
        {
          description: "Vuilniszakken 60 l 20 st",
          quantity: 1,
          unitPrice: 3.19,
          taxCode: "21",
        },
        {
          description: "Afwasmiddel 500 ml",
          quantity: 1,
          unitPrice: 1.99,
          taxCode: "21",
        },
        {
          description: "Boodschappentas",
          quantity: 1,
          unitPrice: 0.25,
          taxCode: "21",
        },
        {
          description: "Postzegels NL 1 (10 st)",
          quantity: 1,
          unitPrice: 11.4,
          taxCode: "exempt",
        },
        { description: "Cadeaubon", quantity: 1, unitPrice: 25, taxCode: "0" },
      ],
    },
  },
};

const unitedStates: CountryProfile = {
  code: "US",
  name: "United States",
  format: { locale: "en-US", currency: "USD" },
  taxName: "Sales Tax",
  // New York City combined state and local rate.
  taxOptions: [
    {
      value: "taxable",
      label: "Taxable (8.875%)",
      shortLabel: "8.875%",
      rate: 0.08875,
    },
    {
      value: "exempt",
      label: "Non-taxable",
      shortLabel: "Non-taxable",
      rate: 0,
      exempt: true,
    },
  ],
  defaultTaxCode: "taxable",
  party: {
    taxIdLabel: "EIN",
    registrationLabel: null,
    bankLabel: "ACH (routing / account)",
    customerTaxId: false,
  },
  invoice: {
    title: "Invoice",
    fileName: "invoice",
    taxTable: null,
    labels: {
      from: "From",
      billTo: "Bill To",
      details: "Invoice Details",
      number: "Invoice #",
      issueDate: "Invoice Date",
      performanceDate: null,
      dueDate: "Due Date",
      paymentTerm: "Terms",
      reference: "PO Number",
      description: "Description",
      quantity: "Qty",
      unitPrice: "Unit Price",
      tax: "Tax",
      amount: "Amount",
      subtotal: "Subtotal",
      exempt: "Non-taxable",
      total: "Total Due",
      notes: "Notes",
      page: (current, total) => `Page ${current} of ${total}`,
      continued: "Continued",
    },
    demo: {
      number: "INV-2026-0147",
      dueDays: 30,
      paymentTerm: "Net 30",
      reference: "PO-88213",
      notes:
        "Thank you for your business. Please make checks payable to Hudson Creative LLC or pay by ACH using the details below.",
      seller: {
        name: "Hudson Creative LLC",
        address: "245 West 29th Street, Suite 400",
        postalCity: "New York, NY 10001",
        country: "United States",
        email: "billing@hudsoncreative.com",
        taxId: "12-3456789",
        registrationId: "",
        bankAccount: "021000021 / 4830119872",
      },
      customer: {
        name: "Brightline Retail Inc.",
        address: "1800 Market Street",
        postalCity: "Philadelphia, PA 19103",
        country: "United States",
        email: "ap@brightlineretail.com",
        taxId: "",
        registrationId: "",
        bankAccount: "",
      },
      items: [
        {
          description: "Website design and development",
          quantity: 1,
          unitPrice: 4800,
          taxCode: "exempt",
        },
        {
          description: "Printed brochures (500 pcs)",
          quantity: 1,
          unitPrice: 640,
          taxCode: "taxable",
        },
      ],
      pool: [
        {
          description: "Brand strategy consulting (hourly)",
          quantity: 10,
          unitPrice: 175,
          taxCode: "exempt",
        },
        {
          description: "Logo design package",
          quantity: 1,
          unitPrice: 1500,
          taxCode: "exempt",
        },
        {
          description: "Copywriting (per page)",
          quantity: 6,
          unitPrice: 120,
          taxCode: "exempt",
        },
        {
          description: "SEO audit",
          quantity: 1,
          unitPrice: 950,
          taxCode: "exempt",
        },
        {
          description: "Social media management (monthly)",
          quantity: 3,
          unitPrice: 1200,
          taxCode: "exempt",
        },
        {
          description: "Web hosting (monthly)",
          quantity: 12,
          unitPrice: 29,
          taxCode: "taxable",
        },
        {
          description: "Domain registration (.com)",
          quantity: 1,
          unitPrice: 18,
          taxCode: "taxable",
        },
        {
          description: "SaaS license (annual)",
          quantity: 5,
          unitPrice: 240,
          taxCode: "taxable",
        },
        {
          description: "Business cards (500 pcs)",
          quantity: 1,
          unitPrice: 89,
          taxCode: "taxable",
        },
        {
          description: "Trade show banner 3x6 ft",
          quantity: 2,
          unitPrice: 210,
          taxCode: "taxable",
        },
        {
          description: "Branded T-shirts",
          quantity: 50,
          unitPrice: 14.5,
          taxCode: "taxable",
        },
        {
          description: "Promotional tote bags",
          quantity: 100,
          unitPrice: 4.25,
          taxCode: "taxable",
        },
        {
          description: "Product photography (day rate)",
          quantity: 1,
          unitPrice: 1800,
          taxCode: "exempt",
        },
        {
          description: "Photo retouching (per image)",
          quantity: 25,
          unitPrice: 12,
          taxCode: "exempt",
        },
        {
          description: "Video editing (hourly)",
          quantity: 8,
          unitPrice: 95,
          taxCode: "exempt",
        },
        {
          description: "Office chair, ergonomic",
          quantity: 2,
          unitPrice: 389,
          taxCode: "taxable",
        },
        {
          description: "27-inch monitor",
          quantity: 2,
          unitPrice: 329.99,
          taxCode: "taxable",
        },
        {
          description: "Laptop stand, aluminum",
          quantity: 3,
          unitPrice: 49.99,
          taxCode: "taxable",
        },
        {
          description: "Mileage reimbursement (per mile)",
          quantity: 140,
          unitPrice: 0.7,
          taxCode: "exempt",
        },
        {
          description: "Travel - airfare",
          quantity: 1,
          unitPrice: 486.4,
          taxCode: "exempt",
        },
        {
          description: "Rush delivery fee",
          quantity: 1,
          unitPrice: 75,
          taxCode: "taxable",
        },
        {
          description: "Training workshop (half day)",
          quantity: 1,
          unitPrice: 1250,
          taxCode: "exempt",
        },
        {
          description: "Maintenance retainer (monthly)",
          quantity: 1,
          unitPrice: 600,
          taxCode: "exempt",
        },
        {
          description: "Software setup fee",
          quantity: 1,
          unitPrice: 350,
          taxCode: "exempt",
        },
        {
          description: "Stock photo licenses",
          quantity: 10,
          unitPrice: 29,
          taxCode: "taxable",
        },
      ],
    },
  },
  receipt: {
    title: "Receipt",
    fileName: "receipt",
    pricesIncludeTax: false,
    paymentMethods: [
      "VISA ****4821",
      "MASTERCARD ****0093",
      "Cash",
      "Debit",
      "Apple Pay",
    ],
    cashMethod: "Cash",
    labels: {
      number: "Trans #",
      register: "Register",
      cashier: "Cashier",
      date: "Date",
      time: "Time",
      total: "TOTAL",
      paidWith: "Paid",
      received: "Cash tendered",
      change: "Change due",
      subtotal: "Subtotal",
      taxSummary: "Tax summary",
      rate: "Rate",
      net: "Taxable",
      tax: "Tax",
      gross: "Total",
      pricesNote: "Sales tax 8.875% applied to taxable items (T)",
      shopTaxId: "EIN",
      shopRegistration: "Store #",
    },
    footerLines: ["Returns accepted within 30 days with receipt"],
    demo: {
      number: "0047-3391",
      register: "4",
      cashier: "Marcus",
      footer: "Thank you for shopping with us!",
      shop: {
        name: "Corner Market",
        address: "512 Columbus Avenue",
        postalCity: "New York, NY 10024",
        phone: "(212) 555-0148",
        website: "www.cornermarketnyc.com",
        taxId: "98-7654321",
        registrationId: "0047",
      },
      items: [
        {
          description: "Whole milk 1 gal",
          quantity: 1,
          unitPrice: 4.29,
          taxCode: "exempt",
        },
        {
          description: "Paper towels 6 rolls",
          quantity: 1,
          unitPrice: 8.99,
          taxCode: "taxable",
        },
        {
          description: "Bananas (lb)",
          quantity: 2.3,
          unitPrice: 0.69,
          taxCode: "exempt",
        },
      ],
      pool: [
        {
          description: "Whole milk 1 gal",
          quantity: 1,
          unitPrice: 4.29,
          taxCode: "exempt",
        },
        {
          description: "Large eggs 12 ct",
          quantity: 1,
          unitPrice: 3.99,
          taxCode: "exempt",
        },
        {
          description: "White bread loaf",
          quantity: 1,
          unitPrice: 3.49,
          taxCode: "exempt",
        },
        {
          description: "Bananas (lb)",
          quantity: 2.3,
          unitPrice: 0.69,
          taxCode: "exempt",
        },
        {
          description: "Chicken breast (lb)",
          quantity: 1.8,
          unitPrice: 5.99,
          taxCode: "exempt",
        },
        {
          description: "Ground coffee 12 oz",
          quantity: 1,
          unitPrice: 9.49,
          taxCode: "exempt",
        },
        {
          description: "Cheddar cheese 8 oz",
          quantity: 1,
          unitPrice: 4.79,
          taxCode: "exempt",
        },
        {
          description: "Orange juice 52 oz",
          quantity: 1,
          unitPrice: 4.99,
          taxCode: "exempt",
        },
        {
          description: "Pasta 16 oz",
          quantity: 2,
          unitPrice: 1.89,
          taxCode: "exempt",
        },
        {
          description: "Peanut butter 16 oz",
          quantity: 1,
          unitPrice: 3.79,
          taxCode: "exempt",
        },
        {
          description: "Paper towels 6 rolls",
          quantity: 1,
          unitPrice: 8.99,
          taxCode: "taxable",
        },
        {
          description: "Dish soap 19 oz",
          quantity: 1,
          unitPrice: 3.29,
          taxCode: "taxable",
        },
        {
          description: "Toothpaste 4 oz",
          quantity: 2,
          unitPrice: 3.99,
          taxCode: "taxable",
        },
        {
          description: "Shampoo 12 oz",
          quantity: 1,
          unitPrice: 6.49,
          taxCode: "taxable",
        },
        {
          description: "AA batteries 8 pk",
          quantity: 1,
          unitPrice: 9.99,
          taxCode: "taxable",
        },
        {
          description: "Trash bags 13 gal 45 ct",
          quantity: 1,
          unitPrice: 11.49,
          taxCode: "taxable",
        },
        {
          description: "Soda 12 pk cans",
          quantity: 1,
          unitPrice: 7.99,
          taxCode: "taxable",
        },
        {
          description: "Potato chips 8 oz",
          quantity: 2,
          unitPrice: 4.29,
          taxCode: "taxable",
        },
        {
          description: "Candy bar",
          quantity: 3,
          unitPrice: 1.59,
          taxCode: "taxable",
        },
        {
          description: "Bottled water 24 pk",
          quantity: 1,
          unitPrice: 5.49,
          taxCode: "taxable",
        },
        {
          description: "Greeting card",
          quantity: 1,
          unitPrice: 4.99,
          taxCode: "taxable",
        },
        {
          description: "Magazine",
          quantity: 1,
          unitPrice: 6.99,
          taxCode: "taxable",
        },
        {
          description: "Reusable bag",
          quantity: 1,
          unitPrice: 0.99,
          taxCode: "taxable",
        },
        {
          description: "Ibuprofen 200 mg 50 ct",
          quantity: 1,
          unitPrice: 7.49,
          taxCode: "exempt",
        },
        {
          description: "Fresh flowers bouquet",
          quantity: 1,
          unitPrice: 12.99,
          taxCode: "taxable",
        },
      ],
    },
  },
};

const hungary: CountryProfile = {
  code: "HU",
  name: "Hungary",
  format: { locale: "hu-HU", currency: "HUF", currencyDigits: 0 },
  taxName: "ÁFA",
  taxOptions: [
    {
      value: "27",
      label: "27% ÁFA",
      shortLabel: "27%",
      rate: 0.27,
      receiptCode: "C",
    },
    {
      value: "18",
      label: "18% ÁFA",
      shortLabel: "18%",
      rate: 0.18,
      receiptCode: "B",
    },
    {
      value: "5",
      label: "5% ÁFA",
      shortLabel: "5%",
      rate: 0.05,
      receiptCode: "A",
    },
    {
      value: "AAM",
      label: "AAM (alanyi adómentes)",
      shortLabel: "AAM",
      rate: 0,
      exempt: true,
      receiptCode: "D",
    },
    {
      value: "TAM",
      label: "TAM (tárgyi adómentes)",
      shortLabel: "TAM",
      rate: 0,
      exempt: true,
      receiptCode: "E",
    },
  ],
  defaultTaxCode: "27",
  party: {
    taxIdLabel: "Adószám",
    registrationLabel: "Cégjegyzékszám",
    bankLabel: "Bankszámlaszám",
    customerTaxId: true,
  },
  invoice: {
    title: "Számla",
    fileName: "szamla",
    taxTable: {
      rate: "ÁFA kulcs",
      base: "Adóalap",
      tax: "ÁFA",
      gross: "Bruttó",
    },
    labels: {
      from: "Szállító",
      billTo: "Vevő",
      details: "Számla adatai",
      number: "Számla sorszáma",
      issueDate: "Kiállítás dátuma",
      performanceDate: "Teljesítés dátuma",
      dueDate: "Fizetési határidő",
      paymentTerm: "Fizetési mód",
      reference: "Megrendelésszám",
      description: "Megnevezés",
      quantity: "Menny.",
      unitPrice: "Nettó egységár",
      tax: "ÁFA",
      amount: "Nettó érték",
      subtotal: "Nettó összesen",
      exempt: "Adómentes",
      total: "Fizetendő (bruttó)",
      notes: "Megjegyzés",
      page: (current, total) => `${current}. oldal / ${total}`,
      continued: "Folytatás",
    },
    demo: {
      number: "SZ-2026/000312",
      dueDays: 8,
      paymentTerm: "Átutalás",
      reference: "MR-2026-0458",
      notes:
        "Kérjük, az összeget a fizetési határidőig szíveskedjen átutalni a megadott bankszámlaszámra. A számla a 2007. évi CXXVII. törvény szerint készült.",
      seller: {
        name: "Példa Stúdió Kft.",
        address: "Király utca 26.",
        postalCity: "1061 Budapest",
        country: "Magyarország",
        email: "szamlazas@peldastudio.hu",
        taxId: "12345678-2-42",
        registrationId: "01-09-123456",
        bankAccount: "11700000-12345678-00000000",
      },
      customer: {
        name: "Vevő Kereskedelmi Zrt.",
        address: "Fő tér 3.",
        postalCity: "9021 Győr",
        country: "Magyarország",
        email: "penzugy@vevozrt.hu",
        taxId: "87654321-2-08",
        registrationId: "",
        bankAccount: "",
      },
      items: [
        {
          description: "Weboldal tervezés és fejlesztés",
          quantity: 1,
          unitPrice: 480000,
          taxCode: "27",
        },
        {
          description: "Nyomdai munka (szórólap, 500 db)",
          quantity: 1,
          unitPrice: 32000,
          taxCode: "27",
        },
      ],
      pool: [
        {
          description: "Tanácsadás (óra)",
          quantity: 8,
          unitPrice: 25000,
          taxCode: "27",
        },
        {
          description: "Projektmenedzsment (óra)",
          quantity: 6,
          unitPrice: 22000,
          taxCode: "27",
        },
        {
          description: "Logótervezés",
          quantity: 1,
          unitPrice: 180000,
          taxCode: "27",
        },
        {
          description: "Arculati kézikönyv",
          quantity: 1,
          unitPrice: 150000,
          taxCode: "27",
        },
        {
          description: "Névjegykártya (250 db)",
          quantity: 1,
          unitPrice: 14500,
          taxCode: "27",
        },
        {
          description: "Webtárhely (hó)",
          quantity: 12,
          unitPrice: 4900,
          taxCode: "27",
        },
        {
          description: "Domain regisztráció .hu",
          quantity: 1,
          unitPrice: 3500,
          taxCode: "27",
        },
        {
          description: "SEO optimalizálás",
          quantity: 1,
          unitPrice: 120000,
          taxCode: "27",
        },
        {
          description: "Szövegírás (oldal)",
          quantity: 5,
          unitPrice: 18000,
          taxCode: "27",
        },
        {
          description: "Fotózás helyszínen",
          quantity: 1,
          unitPrice: 135000,
          taxCode: "27",
        },
        {
          description: "Képfeldolgozás (db)",
          quantity: 20,
          unitPrice: 2500,
          taxCode: "27",
        },
        {
          description: "Közösségi média kezelés (hó)",
          quantity: 3,
          unitPrice: 110000,
          taxCode: "27",
        },
        {
          description: "Karbantartási szerződés (hó)",
          quantity: 1,
          unitPrice: 65000,
          taxCode: "27",
        },
        {
          description: "Szoftverlicenc (év)",
          quantity: 5,
          unitPrice: 42000,
          taxCode: "27",
        },
        {
          description: "Internet-hozzáférés (hó)",
          quantity: 12,
          unitPrice: 6990,
          taxCode: "5",
        },
        {
          description: "Könyv (puhafedeles)",
          quantity: 10,
          unitPrice: 4990,
          taxCode: "5",
        },
        { description: "E-könyv", quantity: 25, unitPrice: 2490, taxCode: "5" },
        {
          description: "Étkezési szolgáltatás (fő)",
          quantity: 12,
          unitPrice: 4500,
          taxCode: "5",
        },
        {
          description: "Tej, 1 l (karton)",
          quantity: 40,
          unitPrice: 389,
          taxCode: "18",
        },
        {
          description: "Pékáru csomag",
          quantity: 15,
          unitPrice: 1200,
          taxCode: "18",
        },
        {
          description: "Nyelvoktatás (10 alkalom)",
          quantity: 1,
          unitPrice: 95000,
          taxCode: "TAM",
        },
        {
          description: "Biztosításközvetítés",
          quantity: 1,
          unitPrice: 45000,
          taxCode: "TAM",
        },
        {
          description: "Ingatlan bérbeadás (hó)",
          quantity: 1,
          unitPrice: 250000,
          taxCode: "TAM",
        },
        {
          description: "Egyéni vállalkozói tanácsadás",
          quantity: 1,
          unitPrice: 60000,
          taxCode: "AAM",
        },
        {
          description: "Útiköltség (km)",
          quantity: 120,
          unitPrice: 140,
          taxCode: "27",
        },
        {
          description: "Parkolási díj",
          quantity: 3,
          unitPrice: 2400,
          taxCode: "27",
        },
        {
          description: "Laptopállvány",
          quantity: 2,
          unitPrice: 15990,
          taxCode: "27",
        },
        {
          description: "Ergonomikus irodai szék",
          quantity: 1,
          unitPrice: 129000,
          taxCode: "27",
        },
        {
          description: "Felhő tárhely 1 TB (hó)",
          quantity: 12,
          unitPrice: 3490,
          taxCode: "27",
        },
        {
          description: "Oktatás: UX workshop",
          quantity: 1,
          unitPrice: 320000,
          taxCode: "27",
        },
      ],
    },
  },
  receipt: {
    title: "Nyugta",
    fileName: "nyugta",
    pricesIncludeTax: true,
    paymentMethods: ["Bankkártya", "Készpénz", "SZÉP-kártya", "Utalvány"],
    cashMethod: "Készpénz",
    labels: {
      number: "Nyugtaszám",
      register: "AP szám",
      cashier: "Pénztáros",
      date: "Dátum",
      time: "Idő",
      total: "ÖSSZESEN",
      paidWith: "Fizetve",
      received: "Átvett összeg",
      change: "Visszajáró",
      subtotal: "Részösszeg",
      taxSummary: "ÁFA összesítő",
      rate: "Kulcs",
      net: "Nettó",
      tax: "ÁFA",
      gross: "Bruttó",
      pricesNote: "Az árak az ÁFA-t tartalmazzák",
      shopTaxId: "Adószám",
      shopRegistration: null,
    },
    footerLines: ["NAV ellenőrző kód: 7K4QX", "Online pénztárgép"],
    demo: {
      number: "0038/00412",
      register: "A12345678",
      cashier: "Kovács Anna",
      footer: "Köszönjük a vásárlást!",
      shop: {
        name: "Sarki ABC Kft.",
        address: "Rákóczi út 18.",
        postalCity: "1072 Budapest",
        phone: "+36 1 234 5678",
        website: "",
        taxId: "23456789-2-42",
        registrationId: "",
      },
      items: [
        {
          description: "Tej 2,8% 1 l",
          quantity: 2,
          unitPrice: 389,
          taxCode: "18",
        },
        {
          description: "Fehér kenyér 1 kg",
          quantity: 1,
          unitPrice: 699,
          taxCode: "18",
        },
        {
          description: "Mosogatószer 500 ml",
          quantity: 1,
          unitPrice: 849,
          taxCode: "27",
        },
      ],
      pool: [
        {
          description: "Tej 2,8% 1 l",
          quantity: 1,
          unitPrice: 389,
          taxCode: "18",
        },
        {
          description: "Fehér kenyér 1 kg",
          quantity: 1,
          unitPrice: 699,
          taxCode: "18",
        },
        {
          description: "Trappista sajt (kg)",
          quantity: 0.42,
          unitPrice: 3290,
          taxCode: "18",
        },
        {
          description: "Tojás M 10 db",
          quantity: 1,
          unitPrice: 899,
          taxCode: "18",
        },
        {
          description: "Vaj 100 g",
          quantity: 2,
          unitPrice: 549,
          taxCode: "18",
        },
        { description: "Kifli", quantity: 6, unitPrice: 59, taxCode: "18" },
        {
          description: "Sertéskaraj (kg)",
          quantity: 0.85,
          unitPrice: 2490,
          taxCode: "5",
        },
        {
          description: "Csirkemell (kg)",
          quantity: 1.1,
          unitPrice: 2190,
          taxCode: "5",
        },
        {
          description: "Friss hal (kg)",
          quantity: 0.6,
          unitPrice: 4990,
          taxCode: "5",
        },
        {
          description: "Banán (kg)",
          quantity: 1.3,
          unitPrice: 599,
          taxCode: "27",
        },
        {
          description: "Alma Idared (kg)",
          quantity: 1,
          unitPrice: 449,
          taxCode: "27",
        },
        {
          description: "Ásványvíz 1,5 l",
          quantity: 2,
          unitPrice: 169,
          taxCode: "27",
        },
        {
          description: "Kávé őrölt 250 g",
          quantity: 1,
          unitPrice: 1899,
          taxCode: "27",
        },
        {
          description: "Csokoládé 100 g",
          quantity: 3,
          unitPrice: 499,
          taxCode: "27",
        },
        {
          description: "Sör 0,5 l",
          quantity: 4,
          unitPrice: 349,
          taxCode: "27",
        },
        {
          description: "Vörösbor 0,75 l",
          quantity: 1,
          unitPrice: 2490,
          taxCode: "27",
        },
        {
          description: "Sampon 300 ml",
          quantity: 1,
          unitPrice: 1299,
          taxCode: "27",
        },
        {
          description: "Fogkrém 75 ml",
          quantity: 2,
          unitPrice: 799,
          taxCode: "27",
        },
        {
          description: "Mosogatószer 500 ml",
          quantity: 1,
          unitPrice: 849,
          taxCode: "27",
        },
        {
          description: "Szemeteszsák 60 l 20 db",
          quantity: 1,
          unitPrice: 699,
          taxCode: "27",
        },
        {
          description: "Elem AA 4 db",
          quantity: 1,
          unitPrice: 1490,
          taxCode: "27",
        },
        {
          description: "Bevásárlótáska",
          quantity: 1,
          unitPrice: 99,
          taxCode: "27",
        },
        { description: "Napilap", quantity: 1, unitPrice: 450, taxCode: "5" },
        { description: "Könyv", quantity: 1, unitPrice: 4990, taxCode: "5" },
        {
          description: "Postabélyeg (10 db)",
          quantity: 1,
          unitPrice: 3100,
          taxCode: "TAM",
        },
        {
          description: "Ajándékutalvány",
          quantity: 1,
          unitPrice: 5000,
          taxCode: "TAM",
        },
      ],
    },
  },
};

export const COUNTRIES: Record<CountryCode, CountryProfile> = {
  NL: netherlands,
  US: unitedStates,
  HU: hungary,
};

export const COUNTRY_LIST: CountryProfile[] = [
  netherlands,
  unitedStates,
  hungary,
];

export function taxOption(profile: CountryProfile, code: string): TaxOption {
  return profile.taxOptions.find((option) => option.value === code) ??
    profile.taxOptions[0];
}
