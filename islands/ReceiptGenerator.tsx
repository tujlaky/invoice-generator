import { useMemo, useState } from "preact/hooks";
import {
  CURRENCY_OPTIONS,
  type CurrencyCode,
  formatAmount,
  formatDate,
  formatMoney,
  formatMoneyPdf,
  formatQuantity,
  toInputDate,
  toNumber,
  truncate,
  VAT_OPTIONS,
  vatFactor,
  vatLabel,
  type VatRate,
  wrapText,
} from "@/lib/format.ts";
import { createPdf, fitImage, parseJpegDataUrl, pdfText } from "@/lib/pdf.ts";

// Receipt prices are consumer prices and therefore include VAT.
type ReceiptItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
};

type PaymentMethod = "PIN" | "Contant" | "iDEAL" | "Creditcard";

type Shop = {
  name: string;
  address: string;
  postalCity: string;
  phone: string;
  website: string;
  kvk: string;
  taxId: string;
};

type ReceiptState = {
  currency: CurrencyCode;
  receiptNumber: string;
  date: string;
  time: string;
  register: string;
  cashier: string;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  logoDataUrl: string;
  shop: Shop;
  footerMessage: string;
  items: ReceiptItem[];
};

const PAYMENT_OPTIONS: PaymentMethod[] = [
  "PIN",
  "Contant",
  "iDEAL",
  "Creditcard",
];

const DEMO_ITEMS: Array<Omit<ReceiptItem, "id">> = [
  {
    description: "Halfvolle melk 1 l",
    quantity: 1,
    unitPrice: 1.19,
    vatRate: "9",
  },
  { description: "Volkorenbrood", quantity: 1, unitPrice: 2.79, vatRate: "9" },
  {
    description: "Jong belegen kaas 500 g",
    quantity: 1,
    unitPrice: 6.49,
    vatRate: "9",
  },
  {
    description: "Bananen (per kg)",
    quantity: 1.2,
    unitPrice: 1.89,
    vatRate: "9",
  },
  {
    description: "Snelfilterkoffie 500 g",
    quantity: 1,
    unitPrice: 7.99,
    vatRate: "9",
  },
  {
    description: "Pindakaas 350 g",
    quantity: 1,
    unitPrice: 2.59,
    vatRate: "9",
  },
  {
    description: "Appels Elstar 1 kg",
    quantity: 1,
    unitPrice: 2.99,
    vatRate: "9",
  },
  {
    description: "Scharreleieren 10 st",
    quantity: 1,
    unitPrice: 3.29,
    vatRate: "9",
  },
  {
    description: "Roomboter 250 g",
    quantity: 2,
    unitPrice: 2.49,
    vatRate: "9",
  },
  {
    description: "Mineraalwater 1,5 l",
    quantity: 2,
    unitPrice: 0.95,
    vatRate: "9",
  },
  { description: "Kipfilet 500 g", quantity: 1, unitPrice: 6.29, vatRate: "9" },
  {
    description: "Chocoladereep 100 g",
    quantity: 3,
    unitPrice: 1.49,
    vatRate: "9",
  },
  {
    description: "Paracetamol 500 mg 20 st",
    quantity: 1,
    unitPrice: 1.79,
    vatRate: "9",
  },
  { description: "Tijdschrift", quantity: 1, unitPrice: 6.95, vatRate: "9" },
  { description: "Boeket tulpen", quantity: 1, unitPrice: 4.99, vatRate: "9" },
  {
    description: "Pils 6 x 33 cl",
    quantity: 1,
    unitPrice: 5.99,
    vatRate: "21",
  },
  {
    description: "Rode wijn 75 cl",
    quantity: 1,
    unitPrice: 8.49,
    vatRate: "21",
  },
  {
    description: "Shampoo 300 ml",
    quantity: 1,
    unitPrice: 4.29,
    vatRate: "21",
  },
  {
    description: "Tandpasta 75 ml",
    quantity: 2,
    unitPrice: 2.19,
    vatRate: "21",
  },
  {
    description: "Batterijen AA 4 st",
    quantity: 1,
    unitPrice: 5.49,
    vatRate: "21",
  },
  {
    description: "Vuilniszakken 60 l 20 st",
    quantity: 1,
    unitPrice: 3.19,
    vatRate: "21",
  },
  {
    description: "Afwasmiddel 500 ml",
    quantity: 1,
    unitPrice: 1.99,
    vatRate: "21",
  },
  {
    description: "Boodschappentas",
    quantity: 1,
    unitPrice: 0.25,
    vatRate: "21",
  },
  {
    description: "Postzegels NL 1 (10 st)",
    quantity: 1,
    unitPrice: 11.4,
    vatRate: "exempt",
  },
  { description: "Cadeaubon", quantity: 1, unitPrice: 25, vatRate: "0" },
];

const now = new Date();

const initialReceipt: ReceiptState = {
  currency: "EUR",
  receiptNumber: "2026-000481",
  date: toInputDate(now),
  time: `${String(now.getHours()).padStart(2, "0")}:${
    String(now.getMinutes()).padStart(2, "0")
  }`,
  register: "3",
  cashier: "Sanne",
  paymentMethod: "PIN",
  cashReceived: 0,
  logoDataUrl: "",
  shop: {
    name: "Buurtsuper De Linde",
    address: "Lindenstraat 12",
    postalCity: "3512 AB Utrecht",
    phone: "030 123 45 67",
    website: "www.buurtsuperdelinde.nl",
    kvk: "87654321",
    taxId: "NL001234567B01",
  },
  footerMessage:
    "Bedankt voor uw aankoop! Ruilen of retourneren kan binnen 14 dagen op vertoon van deze bon.",
  items: [
    {
      id: 1,
      description: "Halfvolle melk 1 l",
      quantity: 2,
      unitPrice: 1.19,
      vatRate: "9",
    },
    {
      id: 2,
      description: "Volkorenbrood",
      quantity: 1,
      unitPrice: 2.79,
      vatRate: "9",
    },
    {
      id: 3,
      description: "Afwasmiddel 500 ml",
      quantity: 1,
      unitPrice: 1.99,
      vatRate: "21",
    },
  ],
};

export default function ReceiptGenerator() {
  const [receipt, setReceipt] = useState<ReceiptState>(initialReceipt);
  const [previewOpen, setPreviewOpen] = useState(false);
  const totals = useMemo(
    () => calculateReceiptTotals(receipt.items),
    [receipt.items],
  );

  const updateReceipt = <K extends keyof ReceiptState>(
    key: K,
    value: ReceiptState[K],
  ) => {
    setReceipt((current) => ({ ...current, [key]: value }));
  };

  const updateShop = (key: keyof Shop, value: string) => {
    setReceipt((current) => ({
      ...current,
      shop: { ...current.shop, [key]: value },
    }));
  };

  const updateItem = <K extends keyof ReceiptItem>(
    id: number,
    key: K,
    value: ReceiptItem[K],
  ) => {
    setReceipt((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addItem = () => {
    const demoItem = DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)];
    setReceipt((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          ...demoItem,
          id: Math.max(0, ...current.items.map((item) => item.id)) + 1,
        },
      ],
    }));
  };

  const removeItem = (id: number) => {
    setReceipt((current) => ({
      ...current,
      items: current.items.length > 1
        ? current.items.filter((item) => item.id !== id)
        : current.items,
    }));
  };

  const updateLogo = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      updateReceipt("logoDataUrl", String(reader.result ?? ""));
    });
    reader.readAsDataURL(file);
  };

  const downloadPdf = () => {
    const pdf = buildReceiptPdf(receipt, totals);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bon-${receipt.receiptNumber || "concept"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main class="invoice-app">
      <section class="editor-panel" aria-label="Receipt details">
        <div class="panel-header">
          <nav class="app-nav" aria-label="Pages">
            <a href="/">Invoice</a>
            <a href="/receipts" aria-current="page">Receipt</a>
          </nav>
          <div>
            <p class="eyebrow">Dutch receipt</p>
            <h1>Receipt generator</h1>
          </div>
          <div class="action-row">
            <button
              type="button"
              class="secondary-button"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </button>
            <button type="button" class="primary-button" onClick={downloadPdf}>
              Download PDF
            </button>
          </div>
        </div>

        <section class="logo-editor" aria-label="Logo">
          <div>
            <h2>Logo</h2>
            <p>Upload a JPEG logo for the receipt preview and PDF.</p>
          </div>
          <div class="logo-control-row">
            <label class="file-button">
              Upload logo
              <input
                type="file"
                accept="image/jpeg"
                onChange={(event) => updateLogo(event.currentTarget.files?.[0])}
              />
            </label>
            {receipt.logoDataUrl && (
              <button
                type="button"
                class="secondary-button"
                onClick={() => updateReceipt("logoDataUrl", "")}
              >
                Remove
              </button>
            )}
          </div>
          <div class="logo-preview-box">
            {receipt.logoDataUrl
              ? <img src={receipt.logoDataUrl} alt="Uploaded logo" />
              : <span>NL</span>}
          </div>
        </section>

        <div class="form-grid">
          <label>
            Currency
            <select
              value={receipt.currency}
              onInput={(event) =>
                updateReceipt(
                  "currency",
                  event.currentTarget.value as CurrencyCode,
                )}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Receipt number
            <input
              value={receipt.receiptNumber}
              onInput={(event) =>
                updateReceipt("receiptNumber", event.currentTarget.value)}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={receipt.date}
              onInput={(event) =>
                updateReceipt("date", event.currentTarget.value)}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={receipt.time}
              onInput={(event) =>
                updateReceipt("time", event.currentTarget.value)}
            />
          </label>
          <label>
            Register
            <input
              value={receipt.register}
              onInput={(event) =>
                updateReceipt("register", event.currentTarget.value)}
            />
          </label>
          <label>
            Cashier
            <input
              value={receipt.cashier}
              onInput={(event) =>
                updateReceipt("cashier", event.currentTarget.value)}
            />
          </label>
          <label>
            Payment method
            <select
              value={receipt.paymentMethod}
              onInput={(event) =>
                updateReceipt(
                  "paymentMethod",
                  event.currentTarget.value as PaymentMethod,
                )}
            >
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          {receipt.paymentMethod === "Contant" && (
            <label>
              Cash received ({receipt.currency})
              <input
                type="number"
                min="0"
                step="0.01"
                value={receipt.cashReceived}
                onInput={(event) =>
                  updateReceipt(
                    "cashReceived",
                    toNumber(event.currentTarget.value),
                  )}
              />
            </label>
          )}
        </div>

        <div class="party-grid">
          <section class="party-fields">
            <h2>Shop</h2>
            <ShopField
              label="Shop name"
              value={receipt.shop.name}
              onInput={(value) => updateShop("name", value)}
            />
            <ShopField
              label="Address"
              value={receipt.shop.address}
              onInput={(value) => updateShop("address", value)}
            />
            <ShopField
              label="Postal code and city"
              value={receipt.shop.postalCity}
              onInput={(value) => updateShop("postalCity", value)}
            />
            <ShopField
              label="Phone"
              value={receipt.shop.phone}
              onInput={(value) => updateShop("phone", value)}
            />
            <ShopField
              label="Website"
              value={receipt.shop.website}
              onInput={(value) => updateShop("website", value)}
            />
            <ShopField
              label="KvK"
              value={receipt.shop.kvk}
              onInput={(value) => updateShop("kvk", value)}
            />
            <ShopField
              label="VAT number"
              value={receipt.shop.taxId}
              onInput={(value) => updateShop("taxId", value)}
            />
          </section>
        </div>

        <section class="line-editor" aria-label="Receipt items">
          <div class="section-heading">
            <h2>Items</h2>
            <button type="button" class="text-button" onClick={addItem}>
              Add item
            </button>
          </div>
          <div class="line-editor-table">
            <div class="line-editor-head">
              <span>Description</span>
              <span>Qty</span>
              <span>Price incl. ({receipt.currency})</span>
              <span>VAT</span>
              <span></span>
            </div>
            {receipt.items.map((item) => (
              <div class="line-editor-row" key={item.id}>
                <input
                  aria-label="Description"
                  value={item.description}
                  onInput={(event) =>
                    updateItem(
                      item.id,
                      "description",
                      event.currentTarget.value,
                    )}
                />
                <input
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onInput={(event) =>
                    updateItem(
                      item.id,
                      "quantity",
                      toNumber(event.currentTarget.value),
                    )}
                />
                <input
                  aria-label="Price including VAT"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onInput={(event) =>
                    updateItem(
                      item.id,
                      "unitPrice",
                      toNumber(event.currentTarget.value),
                    )}
                />
                <select
                  aria-label="VAT"
                  value={item.vatRate}
                  onInput={(event) =>
                    updateItem(
                      item.id,
                      "vatRate",
                      event.currentTarget.value as VatRate,
                    )}
                >
                  {VAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  class="icon-button"
                  title="Remove item"
                  aria-label="Remove item"
                  onClick={() =>
                    removeItem(item.id)}
                  disabled={receipt.items.length === 1}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </section>

        <label class="notes-field">
          Footer message
          <textarea
            rows={3}
            value={receipt.footerMessage}
            onInput={(event) =>
              updateReceipt("footerMessage", event.currentTarget.value)}
          />
        </label>
      </section>

      <section class="preview-panel" aria-label="Receipt preview">
        <ReceiptPaper receipt={receipt} totals={totals} />
      </section>

      {previewOpen && (
        <div class="preview-modal" role="dialog" aria-modal="true">
          <div class="preview-toolbar">
            <button
              type="button"
              class="secondary-button"
              onClick={() =>
                setPreviewOpen(false)}
            >
              Close
            </button>
            <button type="button" class="primary-button" onClick={downloadPdf}>
              Download PDF
            </button>
          </div>
          <div class="modal-paper-wrap">
            <ReceiptPaper receipt={receipt} totals={totals} />
          </div>
        </div>
      )}
    </main>
  );
}

function ShopField(
  props: { label: string; value: string; onInput: (value: string) => void },
) {
  return (
    <label>
      {props.label}
      <input
        value={props.value}
        onInput={(event) => props.onInput(event.currentTarget.value)}
      />
    </label>
  );
}

function ReceiptPaper(
  props: {
    receipt: ReceiptState;
    totals: ReturnType<typeof calculateReceiptTotals>;
  },
) {
  const { receipt, totals } = props;
  const { currency, shop } = receipt;
  const isCash = receipt.paymentMethod === "Contant";
  const change = Math.max(0, receipt.cashReceived - totals.total);

  return (
    <article class="receipt-paper">
      <header class="receipt-head">
        {receipt.logoDataUrl && (
          <img
            class="receipt-logo"
            src={receipt.logoDataUrl}
            alt={`${shop.name} logo`}
          />
        )}
        <h2>{shop.name}</h2>
        <p>{shop.address}</p>
        <p>{shop.postalCity}</p>
        <p>{[shop.phone, shop.website].filter(Boolean).join(" | ")}</p>
        <p>KvK {shop.kvk} | Btw {shop.taxId}</p>
      </header>

      <hr class="receipt-divider" />

      <dl class="receipt-meta">
        <div>
          <dt>Bon</dt>
          <dd>{receipt.receiptNumber || "-"}</dd>
        </div>
        <div>
          <dt>Kassa</dt>
          <dd>{receipt.register || "-"}</dd>
        </div>
        <div>
          <dt>Datum</dt>
          <dd>{formatDate(receipt.date) || "-"}</dd>
        </div>
        <div>
          <dt>Tijd</dt>
          <dd>{receipt.time || "-"}</dd>
        </div>
        <div>
          <dt>Medewerker</dt>
          <dd>{receipt.cashier || "-"}</dd>
        </div>
      </dl>

      <hr class="receipt-divider" />

      <ul class="receipt-lines">
        {receipt.items.map((item) => (
          <li class="receipt-line" key={item.id}>
            <span>
              {item.description}
              {item.quantity !== 1 && (
                <small>
                  {formatQuantity(item.quantity)} x{" "}
                  {formatAmount(item.unitPrice, currency)}
                </small>
              )}
            </span>
            <span>
              {formatAmount(item.quantity * item.unitPrice, currency)}
            </span>
          </li>
        ))}
      </ul>

      <hr class="receipt-divider" />

      <div class="receipt-total">
        <span>Totaal</span>
        <span>{formatMoney(totals.total, currency)}</span>
      </div>
      <div class="receipt-line">
        <span>Betaald met {receipt.paymentMethod}</span>
        <span>{formatMoney(totals.total, currency)}</span>
      </div>
      {isCash && (
        <>
          <div class="receipt-line">
            <span>Ontvangen</span>
            <span>{formatMoney(receipt.cashReceived, currency)}</span>
          </div>
          <div class="receipt-line">
            <span>Wisselgeld</span>
            <span>{formatMoney(change, currency)}</span>
          </div>
        </>
      )}

      <hr class="receipt-divider" />

      <table class="receipt-vat">
        <thead>
          <tr>
            <th>Btw</th>
            <th>Netto</th>
            <th>Btw</th>
            <th>Bruto</th>
          </tr>
        </thead>
        <tbody>
          {totals.vatRows.map((row) => (
            <tr key={row.rate}>
              <td>{row.label}</td>
              <td>{formatAmount(row.net, currency)}</td>
              <td>{formatAmount(row.vat, currency)}</td>
              <td>{formatAmount(row.gross, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr class="receipt-divider" />

      <footer class="receipt-foot">
        <p>{receipt.footerMessage}</p>
        <p>Prijzen inclusief btw</p>
      </footer>
    </article>
  );
}

export function calculateReceiptTotals(items: ReceiptItem[]) {
  const buckets = new Map<
    VatRate,
    { gross: number; net: number; vat: number }
  >();
  let total = 0;

  for (const item of items) {
    const gross = item.quantity * item.unitPrice;
    const net = gross / (1 + vatFactor(item.vatRate));
    total += gross;
    const bucket = buckets.get(item.vatRate) ?? { gross: 0, net: 0, vat: 0 };
    bucket.gross += gross;
    bucket.net += net;
    bucket.vat += gross - net;
    buckets.set(item.vatRate, bucket);
  }

  const order = (rate: VatRate) => rate === "exempt" ? -1 : Number(rate);
  const vatRows = Array.from(buckets.entries())
    .filter(([, bucket]) => bucket.gross > 0)
    .sort(([a], [b]) => order(b) - order(a))
    .map(([rate, bucket]) => ({ rate, label: vatLabel(rate), ...bucket }));
  const vatTotal = vatRows.reduce((sum, row) => sum + row.vat, 0);

  return { total, vatTotal, net: total - vatTotal, vatRows };
}

// Approximate Helvetica advance widths, enough to right-align and centre text.
function approxWidth(value: string, size: number) {
  let units = 0;
  for (const char of value) {
    if (char === " " || char === "." || char === "," || char === "|") {
      units += 0.278;
    } else if (/[A-Z]/.test(char)) units += 0.667;
    else if (/[mw]/.test(char)) units += 0.833;
    else if (/[iljtfr]/.test(char)) units += 0.3;
    else units += 0.556;
  }
  return units * size;
}

export function buildReceiptPdf(
  receipt: ReceiptState,
  totals: ReturnType<typeof calculateReceiptTotals>,
) {
  // 80 mm thermal roll, with the page height following the content.
  const WIDTH = 227;
  const MARGIN = 12;
  const RIGHT = WIDTH - MARGIN;
  const MIN_HEIGHT = 200;

  const { currency } = receipt;
  const logoImage = parseJpegDataUrl(receipt.logoDataUrl);
  const ops: Array<(height: number) => string> = [];
  let cursor = MARGIN + 8;

  const text = (x: number, size: number, value: string, font = "F1") => {
    const y = cursor;
    ops.push((height) =>
      `BT /${font} ${size} Tf ${round(x)} ${round(height - y)} Td ${
        pdfText(value)
      } Tj ET`
    );
  };
  const rightText = (size: number, value: string, font = "F1") => {
    text(RIGHT - approxWidth(value, size), size, value, font);
  };
  const centeredText = (size: number, value: string, font = "F1") => {
    const x = Math.max(MARGIN, (WIDTH - approxWidth(value, size)) / 2);
    text(x, size, value, font);
  };
  const row = (left: string, right: string, size = 8, font = "F1") => {
    text(MARGIN, size, left, font);
    rightText(size, right, font);
    cursor += size + 3;
  };
  const dashed = () => {
    const y = cursor - 2;
    ops.push((height) =>
      `[2 2] 0 d 0.5 w ${MARGIN} ${round(height - y)} m ${RIGHT} ${
        round(height - y)
      } l S [] 0 d`
    );
    cursor += 10;
  };

  if (logoImage) {
    const box = fitImage(logoImage.width, logoImage.height, 100, 40);
    const top = cursor - 6;
    ops.push((height) =>
      `q ${round(box.width)} 0 0 ${round(box.height)} ${
        round((WIDTH - box.width) / 2)
      } ${round(height - top - box.height)} cm /Logo Do Q`
    );
    cursor += box.height + 10;
  }

  centeredText(11, receipt.shop.name, "F2");
  cursor += 14;
  [
    receipt.shop.address,
    receipt.shop.postalCity,
    [receipt.shop.phone, receipt.shop.website].filter(Boolean).join(" | "),
    `KvK ${receipt.shop.kvk} | Btw ${receipt.shop.taxId}`,
  ].filter(Boolean).forEach((value) => {
    centeredText(8, value);
    cursor += 11;
  });

  dashed();
  text(MARGIN, 8, `Bon: ${receipt.receiptNumber}`);
  text(130, 8, `Kassa: ${receipt.register}`);
  cursor += 11;
  text(MARGIN, 8, `Datum: ${formatDate(receipt.date)}`);
  text(130, 8, `Tijd: ${receipt.time}`);
  cursor += 11;
  text(MARGIN, 8, `Medewerker: ${receipt.cashier}`);
  cursor += 11;

  dashed();
  receipt.items.forEach((item) => {
    row(
      truncate(item.description, 30),
      formatAmount(item.quantity * item.unitPrice, currency),
    );
    if (item.quantity !== 1) {
      text(
        MARGIN + 8,
        7,
        `${formatQuantity(item.quantity)} x ${
          formatAmount(item.unitPrice, currency)
        }`,
      );
      cursor += 10;
    }
  });

  dashed();
  row("TOTAAL", formatMoneyPdf(totals.total, currency), 10, "F2");
  cursor += 2;
  row(
    `Betaald met ${receipt.paymentMethod}`,
    formatMoneyPdf(totals.total, currency),
  );
  if (receipt.paymentMethod === "Contant") {
    row("Ontvangen", formatMoneyPdf(receipt.cashReceived, currency));
    row(
      "Wisselgeld",
      formatMoneyPdf(
        Math.max(0, receipt.cashReceived - totals.total),
        currency,
      ),
    );
  }

  dashed();
  text(MARGIN, 8, "Btw-overzicht", "F2");
  cursor += 12;
  const columns = [105, 160, RIGHT];
  const vatRow = (cells: string[], font = "F1") => {
    text(MARGIN, 7, cells[0], font);
    cells.slice(1).forEach((cell, index) => {
      text(columns[index] - approxWidth(cell, 7), 7, cell, font);
    });
    cursor += 10;
  };
  vatRow(["Tarief", "Netto", "Btw", "Bruto"], "F2");
  totals.vatRows.forEach((vat) => {
    vatRow([
      vat.label,
      formatAmount(vat.net, currency),
      formatAmount(vat.vat, currency),
      formatAmount(vat.gross, currency),
    ]);
  });

  dashed();
  wrapText(receipt.footerMessage, 44, 6).forEach((part) => {
    centeredText(8, part);
    cursor += 11;
  });
  centeredText(7, "Prijzen inclusief btw");
  cursor += 10;

  const height = Math.max(MIN_HEIGHT, cursor + MARGIN);
  const stream = ops.map((op) => op(height)).join("\n");
  return createPdf([stream], logoImage, { width: WIDTH, height });
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
