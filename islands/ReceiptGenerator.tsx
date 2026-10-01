import { useMemo, useState } from "preact/hooks";
import {
  COUNTRIES,
  type CountryCode,
  type CountryProfile,
  type Shop,
  type TaxOption,
  taxOption,
} from "@/lib/countries.ts";
import {
  createFormatters,
  type Formatters,
  toInputDate,
  toInputTime,
  toNumber,
  truncate,
  wrapText,
} from "@/lib/format.ts";
import { createPdf, fitImage, parseJpegDataUrl, pdfText } from "@/lib/pdf.ts";
import { CountrySelect } from "@/components/CountrySelect.tsx";
import { LogoEditor } from "@/components/LogoEditor.tsx";
import { PageNav } from "@/components/PageNav.tsx";

type ReceiptItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode: string;
};

type ReceiptState = {
  country: CountryCode;
  receiptNumber: string;
  date: string;
  time: string;
  register: string;
  cashier: string;
  paymentMethod: string;
  cashReceived: number;
  logoDataUrl: string;
  shop: Shop;
  footerMessage: string;
  items: ReceiptItem[];
};

function createReceipt(country: CountryCode, logoDataUrl = ""): ReceiptState {
  const receipt = COUNTRIES[country].receipt;
  const now = new Date();
  return {
    country,
    receiptNumber: receipt.demo.number,
    date: toInputDate(now),
    time: toInputTime(now),
    register: receipt.demo.register,
    cashier: receipt.demo.cashier,
    paymentMethod: receipt.paymentMethods[0],
    cashReceived: 0,
    logoDataUrl,
    shop: { ...receipt.demo.shop },
    footerMessage: receipt.demo.footer,
    items: receipt.demo.items.map((item, index) => ({
      ...item,
      id: index + 1,
    })),
  };
}

export default function ReceiptGenerator() {
  const [receipt, setReceipt] = useState<ReceiptState>(() =>
    createReceipt("NL")
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const profile = COUNTRIES[receipt.country];
  const fmt = useMemo(() => createFormatters(profile.format), [profile]);
  const totals = useMemo(
    () => calculateReceiptTotals(receipt.items, profile),
    [receipt.items, profile],
  );
  const labels = profile.receipt.labels;

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
    const pool = profile.receipt.demo.pool;
    const demoItem = pool[Math.floor(Math.random() * pool.length)];
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

  const downloadPdf = () => {
    const pdf = buildReceiptPdf(receipt, totals);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.receipt.fileName}-${
      receipt.receiptNumber.replace(/[^\w-]+/g, "_") || "draft"
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const isCash = receipt.paymentMethod === profile.receipt.cashMethod;

  return (
    <main class="invoice-app">
      <section class="editor-panel" aria-label="Receipt details">
        <div class="panel-header">
          <PageNav current="receipt" />
          <div>
            <p class="eyebrow">{profile.name} receipt</p>
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

        <LogoEditor
          logoDataUrl={receipt.logoDataUrl}
          fallback={profile.code}
          description="Upload a JPEG logo for the receipt preview and PDF."
          onChange={(value) => updateReceipt("logoDataUrl", value)}
        />

        <div class="form-grid">
          <CountrySelect
            value={receipt.country}
            onChange={(code) =>
              setReceipt(createReceipt(code, receipt.logoDataUrl))}
          />
          <Field
            label={labels.number}
            value={receipt.receiptNumber}
            onInput={(value) => updateReceipt("receiptNumber", value)}
          />
          <Field
            label={labels.date}
            type="date"
            value={receipt.date}
            onInput={(value) => updateReceipt("date", value)}
          />
          <Field
            label={labels.time}
            type="time"
            value={receipt.time}
            onInput={(value) => updateReceipt("time", value)}
          />
          <Field
            label={labels.register}
            value={receipt.register}
            onInput={(value) => updateReceipt("register", value)}
          />
          <Field
            label={labels.cashier}
            value={receipt.cashier}
            onInput={(value) => updateReceipt("cashier", value)}
          />
          <label>
            Payment method
            <select
              value={receipt.paymentMethod}
              onInput={(event) =>
                updateReceipt("paymentMethod", event.currentTarget.value)}
            >
              {profile.receipt.paymentMethods.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          {isCash && (
            <label>
              {labels.received} ({fmt.currency})
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
            <Field
              label="Shop name"
              value={receipt.shop.name}
              onInput={(value) => updateShop("name", value)}
            />
            <Field
              label="Address"
              value={receipt.shop.address}
              onInput={(value) => updateShop("address", value)}
            />
            <Field
              label="Postal code and city"
              value={receipt.shop.postalCity}
              onInput={(value) => updateShop("postalCity", value)}
            />
            <Field
              label="Phone"
              value={receipt.shop.phone}
              onInput={(value) => updateShop("phone", value)}
            />
            <Field
              label="Website"
              value={receipt.shop.website}
              onInput={(value) => updateShop("website", value)}
            />
            <Field
              label={labels.shopTaxId}
              value={receipt.shop.taxId}
              onInput={(value) => updateShop("taxId", value)}
            />
            {labels.shopRegistration && (
              <Field
                label={labels.shopRegistration}
                value={receipt.shop.registrationId}
                onInput={(value) => updateShop("registrationId", value)}
              />
            )}
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
              <span>
                Price {profile.receipt.pricesIncludeTax ? "incl." : "excl."}
                {" "}
                ({fmt.currency})
              </span>
              <span>{profile.taxName}</span>
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
                  aria-label="Price"
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
                  aria-label={profile.taxName}
                  value={item.taxCode}
                  onInput={(event) =>
                    updateItem(item.id, "taxCode", event.currentTarget.value)}
                >
                  {profile.taxOptions.map((option) => (
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
        <ReceiptPaper
          receipt={receipt}
          totals={totals}
          profile={profile}
          fmt={fmt}
        />
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
            <ReceiptPaper
              receipt={receipt}
              totals={totals}
              profile={profile}
              fmt={fmt}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function Field(
  props: {
    label: string;
    value: string;
    type?: string;
    onInput: (value: string) => void;
  },
) {
  return (
    <label>
      {props.label}
      <input
        type={props.type ?? "text"}
        value={props.value}
        onInput={(event) => props.onInput(event.currentTarget.value)}
      />
    </label>
  );
}

// The marker printed after a receipt line: the country's tax letter (HU), or
// "T" for taxable items where tax is added at the bottom (US).
function lineMarker(option: TaxOption, profile: CountryProfile) {
  if (option.receiptCode) return option.receiptCode;
  if (!profile.receipt.pricesIncludeTax && !option.exempt) return "T";
  return "";
}

type PaperProps = {
  receipt: ReceiptState;
  totals: ReturnType<typeof calculateReceiptTotals>;
  profile: CountryProfile;
  fmt: Formatters;
};

function ReceiptPaper({ receipt, totals, profile, fmt }: PaperProps) {
  const labels = profile.receipt.labels;
  const { shop } = receipt;
  const isCash = receipt.paymentMethod === profile.receipt.cashMethod;
  const change = Math.max(0, receipt.cashReceived - totals.total);
  const includesTax = profile.receipt.pricesIncludeTax;

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
        {(shop.phone || shop.website) && (
          <p>{[shop.phone, shop.website].filter(Boolean).join(" | ")}</p>
        )}
        <p>
          {[
            labels.shopRegistration && shop.registrationId
              ? `${labels.shopRegistration} ${shop.registrationId}`
              : "",
            `${labels.shopTaxId} ${shop.taxId}`,
          ].filter(Boolean).join(" | ")}
        </p>
        <p class="receipt-doc-title">{profile.receipt.title}</p>
      </header>

      <hr class="receipt-divider" />

      <dl class="receipt-meta">
        <div>
          <dt>{labels.number}</dt>
          <dd>{receipt.receiptNumber || "-"}</dd>
        </div>
        <div>
          <dt>{labels.register}</dt>
          <dd>{receipt.register || "-"}</dd>
        </div>
        <div>
          <dt>{labels.date}</dt>
          <dd>{fmt.date(receipt.date) || "-"}</dd>
        </div>
        <div>
          <dt>{labels.time}</dt>
          <dd>{fmt.time(receipt.time) || "-"}</dd>
        </div>
        <div>
          <dt>{labels.cashier}</dt>
          <dd>{receipt.cashier || "-"}</dd>
        </div>
      </dl>

      <hr class="receipt-divider" />

      <ul class="receipt-lines">
        {receipt.items.map((item) => {
          const marker = lineMarker(taxOption(profile, item.taxCode), profile);
          return (
            <li class="receipt-line" key={item.id}>
              <span>
                {item.description}
                {item.quantity !== 1 && (
                  <small>
                    {fmt.quantity(item.quantity)} x {fmt.amount(item.unitPrice)}
                  </small>
                )}
              </span>
              <span>
                {fmt.amount(item.quantity * item.unitPrice)}
                {marker && <em class="receipt-marker">{marker}</em>}
              </span>
            </li>
          );
        })}
      </ul>

      <hr class="receipt-divider" />

      {!includesTax && (
        <>
          <div class="receipt-line">
            <span>{labels.subtotal}</span>
            <span>{fmt.amount(totals.subtotal)}</span>
          </div>
          {totals.rows.filter((row) => row.tax > 0).map((row) => (
            <div class="receipt-line" key={row.code}>
              <span>{profile.taxName} {row.label}</span>
              <span>{fmt.amount(row.tax)}</span>
            </div>
          ))}
        </>
      )}
      <div class="receipt-total">
        <span>{labels.total}</span>
        <span>{fmt.money(totals.total)}</span>
      </div>
      <div class="receipt-line">
        <span>{labels.paidWith} {receipt.paymentMethod}</span>
        <span>{fmt.money(totals.total)}</span>
      </div>
      {isCash && (
        <>
          <div class="receipt-line">
            <span>{labels.received}</span>
            <span>{fmt.money(receipt.cashReceived)}</span>
          </div>
          <div class="receipt-line">
            <span>{labels.change}</span>
            <span>{fmt.money(change)}</span>
          </div>
        </>
      )}

      {includesTax && (
        <>
          <hr class="receipt-divider" />
          <p class="receipt-section-title">{labels.taxSummary}</p>
          <table class="receipt-vat">
            <thead>
              <tr>
                <th>{labels.rate}</th>
                <th>{labels.net}</th>
                <th>{labels.tax}</th>
                <th>{labels.gross}</th>
              </tr>
            </thead>
            <tbody>
              {totals.rows.map((row) => (
                <tr key={row.code}>
                  <td>
                    {row.receiptCode ? `${row.receiptCode} ` : ""}
                    {row.label}
                  </td>
                  <td>{fmt.amount(row.net)}</td>
                  <td>{fmt.amount(row.tax)}</td>
                  <td>{fmt.amount(row.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <hr class="receipt-divider" />

      <footer class="receipt-foot">
        <p>{receipt.footerMessage}</p>
        {profile.receipt.footerLines.map((value) => <p key={value}>{value}</p>)}
        <p>{labels.pricesNote}</p>
      </footer>
    </article>
  );
}

export function calculateReceiptTotals(
  items: ReceiptItem[],
  profile: CountryProfile,
) {
  const includesTax = profile.receipt.pricesIncludeTax;
  const buckets = new Map<
    string,
    { gross: number; net: number; tax: number }
  >();
  let subtotal = 0;
  let total = 0;

  for (const item of items) {
    const option = taxOption(profile, item.taxCode);
    const price = item.quantity * item.unitPrice;
    const net = includesTax ? price / (1 + option.rate) : price;
    const gross = includesTax ? price : price * (1 + option.rate);
    subtotal += net;
    total += gross;
    const bucket = buckets.get(option.value) ?? { gross: 0, net: 0, tax: 0 };
    bucket.gross += gross;
    bucket.net += net;
    bucket.tax += gross - net;
    buckets.set(option.value, bucket);
  }

  const rows = profile.taxOptions
    .filter((option) => buckets.has(option.value))
    .map((option) => ({
      code: option.value,
      label: option.shortLabel,
      receiptCode: option.receiptCode,
      ...buckets.get(option.value)!,
    }))
    .filter((row) => row.gross > 0);
  const taxTotal = rows.reduce((sum, row) => sum + row.tax, 0);

  return { subtotal, taxTotal, total, rows };
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
  const profile = COUNTRIES[receipt.country];
  const labels = profile.receipt.labels;
  const fmt = createFormatters(profile.format);
  const includesTax = profile.receipt.pricesIncludeTax;

  // 80 mm thermal roll, with the page height following the content.
  const WIDTH = 227;
  const MARGIN = 12;
  const RIGHT = WIDTH - MARGIN;
  const MIN_HEIGHT = 200;

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

  const { shop } = receipt;
  centeredText(11, shop.name, "F2");
  cursor += 14;
  [
    shop.address,
    shop.postalCity,
    [shop.phone, shop.website].filter(Boolean).join(" | "),
    [
      labels.shopRegistration && shop.registrationId
        ? `${labels.shopRegistration} ${shop.registrationId}`
        : "",
      `${labels.shopTaxId} ${shop.taxId}`,
    ].filter(Boolean).join(" | "),
  ].filter(Boolean).forEach((value) => {
    centeredText(8, value);
    cursor += 11;
  });
  cursor += 2;
  centeredText(9, profile.receipt.title.toUpperCase(), "F2");
  cursor += 12;

  dashed();
  text(MARGIN, 8, `${labels.number}: ${receipt.receiptNumber}`);
  text(125, 8, `${labels.register}: ${receipt.register}`);
  cursor += 11;
  text(MARGIN, 8, `${labels.date}: ${fmt.date(receipt.date)}`);
  text(125, 8, `${labels.time}: ${fmt.time(receipt.time)}`);
  cursor += 11;
  text(MARGIN, 8, `${labels.cashier}: ${receipt.cashier}`);
  cursor += 11;

  dashed();
  receipt.items.forEach((item) => {
    const marker = lineMarker(taxOption(profile, item.taxCode), profile);
    const amount = fmt.amount(item.quantity * item.unitPrice);
    text(MARGIN, 8, truncate(item.description, 28));
    // Keep the amount column aligned by reserving a fixed slot for the marker.
    text(RIGHT - 10 - approxWidth(amount, 8), 8, amount);
    if (marker) text(RIGHT - 6, 7, marker);
    cursor += 11;
    if (item.quantity !== 1) {
      text(
        MARGIN + 8,
        7,
        `${fmt.quantity(item.quantity)} x ${fmt.amount(item.unitPrice)}`,
      );
      cursor += 10;
    }
  });

  dashed();
  if (!includesTax) {
    row(labels.subtotal, fmt.amount(totals.subtotal));
    totals.rows.filter((tax) => tax.tax > 0).forEach((tax) => {
      row(`${profile.taxName} ${tax.label}`, fmt.amount(tax.tax));
    });
    cursor += 2;
  }
  row(labels.total, fmt.moneyPdf(totals.total), 10, "F2");
  cursor += 2;
  row(
    `${labels.paidWith} ${receipt.paymentMethod}`,
    fmt.moneyPdf(totals.total),
  );
  if (receipt.paymentMethod === profile.receipt.cashMethod) {
    row(labels.received, fmt.moneyPdf(receipt.cashReceived));
    row(
      labels.change,
      fmt.moneyPdf(Math.max(0, receipt.cashReceived - totals.total)),
    );
  }

  if (includesTax) {
    dashed();
    text(MARGIN, 8, labels.taxSummary, "F2");
    cursor += 12;
    const columns = [105, 160, RIGHT];
    const taxRow = (cells: string[], font = "F1") => {
      text(MARGIN, 7, cells[0], font);
      cells.slice(1).forEach((cell, index) => {
        text(columns[index] - approxWidth(cell, 7), 7, cell, font);
      });
      cursor += 10;
    };
    taxRow([labels.rate, labels.net, labels.tax, labels.gross], "F2");
    totals.rows.forEach((tax) => {
      taxRow([
        `${tax.receiptCode ? `${tax.receiptCode} ` : ""}${tax.label}`,
        fmt.amount(tax.net),
        fmt.amount(tax.tax),
        fmt.amount(tax.gross),
      ]);
    });
  }

  dashed();
  wrapText(receipt.footerMessage, 44, 6).forEach((part) => {
    centeredText(8, part);
    cursor += 11;
  });
  profile.receipt.footerLines.forEach((value) => {
    centeredText(8, value);
    cursor += 11;
  });
  centeredText(7, labels.pricesNote);
  cursor += 10;

  const height = Math.max(MIN_HEIGHT, cursor + MARGIN);
  const stream = ops.map((op) => op(height)).join("\n");
  return createPdf([stream], logoImage, { width: WIDTH, height });
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
