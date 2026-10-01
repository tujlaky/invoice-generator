import { useMemo, useState } from "preact/hooks";
import {
  COUNTRIES,
  type CountryCode,
  type CountryProfile,
  type Party,
  taxOption,
} from "@/lib/countries.ts";
import {
  createFormatters,
  type Formatters,
  toInputDate,
  toNumber,
  truncate,
  wrapText,
} from "@/lib/format.ts";
import { createPdf, fitImage, parseJpegDataUrl, pdfText } from "@/lib/pdf.ts";
import { CountrySelect } from "@/components/CountrySelect.tsx";
import { LogoEditor } from "@/components/LogoEditor.tsx";
import { PageNav } from "@/components/PageNav.tsx";

type LineItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode: string;
};

type InvoiceState = {
  country: CountryCode;
  invoiceNumber: string;
  invoiceDate: string;
  performanceDate: string;
  dueDate: string;
  paymentTerm: string;
  reference: string;
  logoDataUrl: string;
  seller: Party;
  customer: Party;
  notes: string;
  items: LineItem[];
};

// Builds a fresh invoice from the country's demo data. Switching country
// replaces the document, because parties, items and tax codes are specific
// to each country.
function createInvoice(country: CountryCode, logoDataUrl = ""): InvoiceState {
  const demo = COUNTRIES[country].invoice.demo;
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + demo.dueDays);

  return {
    country,
    invoiceNumber: demo.number,
    invoiceDate: toInputDate(today),
    performanceDate: toInputDate(today),
    dueDate: toInputDate(due),
    paymentTerm: demo.paymentTerm,
    reference: demo.reference,
    logoDataUrl,
    seller: { ...demo.seller },
    customer: { ...demo.customer },
    notes: demo.notes,
    items: demo.items.map((item, index) => ({ ...item, id: index + 1 })),
  };
}

export default function InvoiceGenerator() {
  const [invoice, setInvoice] = useState<InvoiceState>(() =>
    createInvoice("NL")
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const profile = COUNTRIES[invoice.country];
  const fmt = useMemo(() => createFormatters(profile.format), [profile]);
  const totals = useMemo(
    () => calculateTotals(invoice.items, profile),
    [invoice.items, profile],
  );

  const updateInvoice = <K extends keyof InvoiceState>(
    key: K,
    value: InvoiceState[K],
  ) => {
    setInvoice((current) => ({ ...current, [key]: value }));
  };

  const updateParty = (
    party: "seller" | "customer",
    key: keyof Party,
    value: string,
  ) => {
    setInvoice((current) => ({
      ...current,
      [party]: { ...current[party], [key]: value },
    }));
  };

  const updateItem = <K extends keyof LineItem>(
    id: number,
    key: K,
    value: LineItem[K],
  ) => {
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addItem = () => {
    const pool = profile.invoice.demo.pool;
    const demoItem = pool[Math.floor(Math.random() * pool.length)];
    setInvoice((current) => ({
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
    setInvoice((current) => ({
      ...current,
      items: current.items.length > 1
        ? current.items.filter((item) => item.id !== id)
        : current.items,
    }));
  };

  const downloadPdf = () => {
    const pdf = buildPdf(invoice, totals);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.invoice.fileName}-${
      invoice.invoiceNumber.replace(/[^\w-]+/g, "_") || "draft"
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const labels = profile.invoice.labels;

  return (
    <main class="invoice-app">
      <section class="editor-panel" aria-label="Invoice details">
        <div class="panel-header">
          <PageNav current="invoice" />
          <div>
            <p class="eyebrow">{profile.name} invoice</p>
            <h1>Invoice generator</h1>
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
          logoDataUrl={invoice.logoDataUrl}
          fallback={profile.code}
          description="Upload a JPEG logo for the generated invoice preview and PDF."
          onChange={(value) => updateInvoice("logoDataUrl", value)}
        />

        <div class="form-grid">
          <CountrySelect
            value={invoice.country}
            onChange={(code) =>
              setInvoice(createInvoice(code, invoice.logoDataUrl))}
          />
          <TextField
            label={labels.number}
            value={invoice.invoiceNumber}
            onInput={(value) => updateInvoice("invoiceNumber", value)}
          />
          <TextField
            label={labels.issueDate}
            type="date"
            value={invoice.invoiceDate}
            onInput={(value) => updateInvoice("invoiceDate", value)}
          />
          {labels.performanceDate && (
            <TextField
              label={labels.performanceDate}
              type="date"
              value={invoice.performanceDate}
              onInput={(value) => updateInvoice("performanceDate", value)}
            />
          )}
          <TextField
            label={labels.dueDate}
            type="date"
            value={invoice.dueDate}
            onInput={(value) => updateInvoice("dueDate", value)}
          />
          <TextField
            label={labels.paymentTerm}
            value={invoice.paymentTerm}
            onInput={(value) => updateInvoice("paymentTerm", value)}
          />
          <TextField
            label={labels.reference}
            value={invoice.reference}
            onInput={(value) => updateInvoice("reference", value)}
          />
        </div>

        <div class="party-grid">
          <PartyFields
            title={labels.from}
            party={invoice.seller}
            profile={profile}
            seller
            onChange={(key, value) => updateParty("seller", key, value)}
          />
          <PartyFields
            title={labels.billTo}
            party={invoice.customer}
            profile={profile}
            onChange={(key, value) => updateParty("customer", key, value)}
          />
        </div>

        <section class="line-editor" aria-label="Invoice line items">
          <div class="section-heading">
            <h2>Line items</h2>
            <button type="button" class="text-button" onClick={addItem}>
              Add line item
            </button>
          </div>
          <div class="line-editor-table">
            <div class="line-editor-head">
              <span>Description</span>
              <span>Qty</span>
              <span>Price ({fmt.currency})</span>
              <span>{profile.taxName}</span>
              <span></span>
            </div>
            {invoice.items.map((item) => (
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
                  title="Remove line item"
                  aria-label="Remove line item"
                  onClick={() =>
                    removeItem(item.id)}
                  disabled={invoice.items.length === 1}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </section>

        <label class="notes-field">
          {labels.notes}
          <textarea
            rows={3}
            value={invoice.notes}
            onInput={(event) =>
              updateInvoice("notes", event.currentTarget.value)}
          />
        </label>
      </section>

      <section class="preview-panel" aria-label="Invoice preview">
        <InvoicePaper
          invoice={invoice}
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
            <InvoicePaper
              invoice={invoice}
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

function TextField(
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

function PartyFields(
  props: {
    title: string;
    party: Party;
    profile: CountryProfile;
    seller?: boolean;
    onChange: (key: keyof Party, value: string) => void;
  },
) {
  const { party, profile } = props;
  const labels = profile.party;
  const field = (key: keyof Party, label: string, type?: string) => (
    <TextField
      label={label}
      type={type}
      value={party[key]}
      onInput={(value) => props.onChange(key, value)}
    />
  );

  return (
    <section class="party-fields">
      <h2>{props.title}</h2>
      {field("name", "Company name")}
      {field("address", "Address")}
      {field("postalCity", "Postal code and city")}
      {field("country", "Country")}
      {field("email", "Email", "email")}
      {(props.seller || labels.customerTaxId) &&
        field("taxId", labels.taxIdLabel)}
      {props.seller && labels.registrationLabel &&
        field("registrationId", labels.registrationLabel)}
      {props.seller && field("bankAccount", labels.bankLabel)}
    </section>
  );
}

type PaperProps = {
  invoice: InvoiceState;
  totals: ReturnType<typeof calculateTotals>;
  profile: CountryProfile;
  fmt: Formatters;
};

function InvoicePaper({ invoice, totals, profile, fmt }: PaperProps) {
  const labels = profile.invoice.labels;

  return (
    <article class="invoice-paper">
      <header class="invoice-header">
        {invoice.logoDataUrl
          ? (
            <img
              class="invoice-logo"
              src={invoice.logoDataUrl}
              alt={`${invoice.seller.name} logo`}
            />
          )
          : (
            <div class="logo-mark" aria-hidden="true">
              {profile.code}
            </div>
          )}
        <div class="invoice-title">
          <p>{profile.invoice.title}</p>
          <h2>{invoice.invoiceNumber}</h2>
        </div>
      </header>

      <section class="invoice-addresses">
        <AddressBlock
          title={labels.from}
          party={invoice.seller}
          profile={profile}
          seller
        />
        <AddressBlock
          title={labels.billTo}
          party={invoice.customer}
          profile={profile}
        />
      </section>

      <section class="invoice-meta">
        <Meta label={labels.issueDate} value={fmt.date(invoice.invoiceDate)} />
        {labels.performanceDate && (
          <Meta
            label={labels.performanceDate}
            value={fmt.date(invoice.performanceDate)}
          />
        )}
        <Meta label={labels.dueDate} value={fmt.date(invoice.dueDate)} />
        <Meta label={labels.paymentTerm} value={invoice.paymentTerm} />
        <Meta label={labels.reference} value={invoice.reference} />
      </section>

      <div class="invoice-table">
        <div class="invoice-table-head">
          <span>{labels.description}</span>
          <span>{labels.quantity}</span>
          <span>{labels.unitPrice}</span>
          <span>{labels.tax}</span>
          <span>{labels.amount}</span>
        </div>
        {invoice.items.map((item) => (
          <div class="invoice-table-row" key={item.id}>
            <span>{item.description}</span>
            <span>{fmt.quantity(item.quantity)}</span>
            <span>{fmt.money(item.unitPrice)}</span>
            <span>{taxOption(profile, item.taxCode).shortLabel}</span>
            <span>{fmt.money(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
      </div>

      <section class="invoice-bottom">
        <div class="invoice-note">
          <h3>{labels.notes}</h3>
          <p>{invoice.notes}</p>
          <p class="bank-line">
            {profile.party.bankLabel}: {invoice.seller.bankAccount}
          </p>
          {profile.invoice.taxTable && (
            <table class="invoice-tax-table">
              <thead>
                <tr>
                  <th>{profile.invoice.taxTable.rate}</th>
                  <th>{profile.invoice.taxTable.base}</th>
                  <th>{profile.invoice.taxTable.tax}</th>
                  <th>{profile.invoice.taxTable.gross}</th>
                </tr>
              </thead>
              <tbody>
                {totals.taxRows.map((row) => (
                  <tr key={row.code}>
                    <td>{row.shortLabel}</td>
                    <td>{fmt.money(row.base)}</td>
                    <td>{fmt.money(row.amount)}</td>
                    <td>{fmt.money(row.base + row.amount)}</td>
                  </tr>
                ))}
                {totals.exemptTotal > 0 && (
                  <tr>
                    <td>{labels.exempt}</td>
                    <td>{fmt.money(totals.exemptTotal)}</td>
                    <td>{fmt.money(0)}</td>
                    <td>{fmt.money(totals.exemptTotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div class="totals-box">
          <TotalRow
            label={labels.subtotal}
            value={fmt.money(totals.subtotal)}
          />
          {totals.taxRows.map((row) => (
            <TotalRow
              key={row.code}
              label={row.label}
              value={fmt.money(row.amount)}
            />
          ))}
          {totals.exemptTotal > 0 && (
            <TotalRow
              label={labels.exempt}
              value={fmt.money(totals.exemptTotal)}
            />
          )}
          <div class="grand-total">
            <span>{labels.total}</span>
            <strong>{fmt.money(totals.total)}</strong>
          </div>
        </div>
      </section>

      <footer class="invoice-footer">
        <span>{invoice.seller.name}</span>
        {profile.party.registrationLabel && invoice.seller.registrationId && (
          <span>
            {profile.party.registrationLabel} {invoice.seller.registrationId}
          </span>
        )}
        <span>{profile.party.taxIdLabel} {invoice.seller.taxId}</span>
        <span>{invoice.seller.email}</span>
      </footer>
    </article>
  );
}

function AddressBlock(
  props: {
    title: string;
    party: Party;
    profile: CountryProfile;
    seller?: boolean;
  },
) {
  const { party, profile } = props;
  const showTaxId = (props.seller || profile.party.customerTaxId) &&
    party.taxId;
  return (
    <div>
      <h3>{props.title}</h3>
      <p class="address-name">{party.name}</p>
      <p>{party.address}</p>
      <p>{party.postalCity}</p>
      <p>{party.country}</p>
      <p>{party.email}</p>
      {showTaxId && <p>{profile.party.taxIdLabel}: {party.taxId}</p>}
      {props.seller && profile.party.registrationLabel &&
        party.registrationId && (
        <p>{profile.party.registrationLabel}: {party.registrationId}</p>
      )}
    </div>
  );
}

function Meta(props: { label: string; value: string }) {
  return (
    <div>
      <span>{props.label}</span>
      <strong>{props.value || "-"}</strong>
    </div>
  );
}

function TotalRow(props: { label: string; value: string }) {
  return (
    <div class="total-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

export function calculateTotals(items: LineItem[], profile: CountryProfile) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const buckets = new Map<string, { base: number; amount: number }>();
  let exemptTotal = 0;

  for (const item of items) {
    const net = item.quantity * item.unitPrice;
    const option = taxOption(profile, item.taxCode);
    if (option.exempt) {
      exemptTotal += net;
      continue;
    }
    const bucket = buckets.get(option.value) ?? { base: 0, amount: 0 };
    bucket.base += net;
    bucket.amount += net * option.rate;
    buckets.set(option.value, bucket);
  }

  const taxRows = profile.taxOptions
    .filter((option) => !option.exempt && buckets.has(option.value))
    .map((option) => ({
      code: option.value,
      shortLabel: option.shortLabel,
      label: `${profile.taxName} ${option.shortLabel}`,
      ...buckets.get(option.value)!,
    }))
    .filter((row) => row.base > 0);

  const taxTotal = taxRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    subtotal,
    exemptTotal,
    taxRows,
    taxTotal,
    total: subtotal + taxTotal,
  };
}

export function buildPdf(
  invoice: InvoiceState,
  totals: ReturnType<typeof calculateTotals>,
) {
  const profile = COUNTRIES[invoice.country];
  const labels = profile.invoice.labels;
  const fmt = createFormatters(profile.format);

  const PAGE_TOP = 785;
  const CONTINUATION_TABLE_TOP = 740;
  const FIRST_PAGE_TABLE_TOP = 559;
  const ROW_HEIGHT = 28;
  // Lowest baseline where table rows may be drawn; below this sits the footer.
  const BODY_BOTTOM = 110;
  const FOOTER_TOP = 95;

  const logoImage = parseJpegDataUrl(invoice.logoDataUrl);
  const pages: string[][] = [];
  let content: string[] = [];

  const text = (x: number, y: number, size: number, value: string) => {
    content.push(`BT /F1 ${size} Tf ${x} ${y} Td ${pdfText(value)} Tj ET`);
  };
  const bold = (x: number, y: number, size: number, value: string) => {
    content.push(`BT /F2 ${size} Tf ${x} ${y} Td ${pdfText(value)} Tj ET`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    content.push(`0.6 w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const fillRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    shade: number,
  ) => {
    content.push(
      `${shade} ${shade} ${shade} rg ${x} ${y} ${width} ${height} re f 0 0 0 rg`,
    );
  };
  const image = (
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    content.push(`q ${width} 0 0 ${height} ${x} ${y} cm /${name} Do Q`);
  };

  const startPage = () => {
    content = [];
    pages.push(content);
  };

  const startContinuationPage = () => {
    startPage();
    bold(48, PAGE_TOP, 13, `${profile.invoice.title} ${invoice.invoiceNumber}`);
    text(48, PAGE_TOP - 15, 9, labels.continued);
    bold(380, PAGE_TOP, 13, invoice.seller.name);
    line(48, PAGE_TOP - 27, 548, PAGE_TOP - 27);
  };

  // Draws the table header with its top edge at `top` and returns the
  // baseline for the first row beneath it.
  const drawTableHeader = (top: number) => {
    fillRect(48, top - 24, 500, 24, 0.18);
    content.push("1 1 1 rg");
    bold(60, top - 16, 9, labels.description);
    bold(280, top - 16, 9, labels.quantity);
    bold(340, top - 16, 9, labels.unitPrice);
    bold(410, top - 16, 9, labels.tax);
    bold(474, top - 16, 9, labels.amount);
    content.push("0 0 0 rg");
    return top - 47;
  };

  startPage();

  if (logoImage) {
    const logoBox = fitImage(logoImage.width, logoImage.height, 132, 46);
    image("Logo", 48, 786 - logoBox.height, logoBox.width, logoBox.height);
    bold(48, 718, 22, profile.invoice.title);
    text(48, 697, 10, invoice.invoiceNumber);
  } else {
    bold(48, 785, 30, profile.invoice.title);
    text(48, 760, 11, invoice.invoiceNumber);
  }

  const seller = invoice.seller;
  const sellerLines = [
    seller.address,
    seller.postalCity,
    seller.country,
    `${profile.party.taxIdLabel} ${seller.taxId}`,
    profile.party.registrationLabel && seller.registrationId
      ? `${profile.party.registrationLabel} ${seller.registrationId}`
      : "",
    seller.email,
  ].filter(Boolean);
  bold(380, 785, 13, seller.name);
  sellerLines.forEach((value, index) => {
    text(380, 766 - index * 14, 10, value);
  });

  fillRect(48, 646, 500, 38, 0.94);
  bold(62, 664, 10, labels.billTo);
  bold(320, 664, 10, labels.details);
  const customer = invoice.customer;
  const customerLines = [
    customer.name,
    customer.address,
    customer.postalCity,
    customer.country,
    profile.party.customerTaxId && customer.taxId
      ? `${profile.party.taxIdLabel} ${customer.taxId}`
      : "",
  ].filter(Boolean);
  customerLines.forEach((value, index) => {
    text(62, 620 - index * 14, 10, value);
  });
  const metaLines = [
    `${labels.issueDate}: ${fmt.date(invoice.invoiceDate)}`,
    labels.performanceDate
      ? `${labels.performanceDate}: ${fmt.date(invoice.performanceDate)}`
      : "",
    `${labels.dueDate}: ${fmt.date(invoice.dueDate)}`,
    `${labels.paymentTerm}: ${invoice.paymentTerm}`,
    `${labels.reference}: ${invoice.reference}`,
  ].filter(Boolean);
  metaLines.forEach((value, index) => {
    text(320, 620 - index * 14, 10, value);
  });

  let y = drawTableHeader(FIRST_PAGE_TABLE_TOP);

  invoice.items.forEach((item) => {
    if (y < BODY_BOTTOM) {
      startContinuationPage();
      y = drawTableHeader(CONTINUATION_TABLE_TOP);
    }
    const lineTotal = item.quantity * item.unitPrice;
    text(60, y, 9, truncate(item.description, 36));
    text(284, y, 9, fmt.quantity(item.quantity));
    text(340, y, 9, fmt.moneyPdf(item.unitPrice));
    text(414, y, 9, taxOption(profile, item.taxCode).shortLabel);
    text(474, y, 9, fmt.moneyPdf(lineTotal));
    line(48, y - 9, 548, y - 9);
    y -= ROW_HEIGHT;
  });

  // Totals, the optional tax table and the notes are drawn as one block under
  // the last row. If it does not fit above the footer, it moves to a new page.
  const noteLines = wrapText(invoice.notes, 68);
  const totalsRowCount = totals.taxRows.length +
    (totals.exemptTotal > 0 ? 1 : 0);
  const totalsBlockHeight = 24 + 20 + 18 * totalsRowCount + 8 + 12;
  const taxTableHeight = profile.invoice.taxTable
    ? 14 * (totalsRowCount + 1) + 22
    : 0;
  const notesBlockHeight = 24 + 19 + Math.max(0, noteLines.length - 1) * 14;
  let totalsTop = y + 4;
  if (
    totalsTop - totalsBlockHeight - taxTableHeight - notesBlockHeight <
      FOOTER_TOP
  ) {
    startContinuationPage();
    totalsTop = CONTINUATION_TABLE_TOP;
  }

  line(320, totalsTop, 548, totalsTop);
  text(330, totalsTop - 24, 10, labels.subtotal);
  bold(464, totalsTop - 24, 10, fmt.moneyPdf(totals.subtotal));
  let totalLineY = totalsTop - 44;
  totals.taxRows.forEach((row) => {
    text(330, totalLineY, 10, row.label);
    bold(464, totalLineY, 10, fmt.moneyPdf(row.amount));
    totalLineY -= 18;
  });
  if (totals.exemptTotal > 0) {
    text(330, totalLineY, 10, labels.exempt);
    bold(464, totalLineY, 10, fmt.moneyPdf(totals.exemptTotal));
    totalLineY -= 18;
  }
  totalLineY -= 8;
  fillRect(320, totalLineY - 12, 228, 28, 0.18);
  content.push("1 1 1 rg");
  bold(330, totalLineY - 2, 11, labels.total);
  bold(440, totalLineY - 2, 11, fmt.moneyPdf(totals.total));
  content.push("0 0 0 rg");

  let leftY = totalsTop - 24;
  if (profile.invoice.taxTable) {
    const columns = [48, 110, 185, 255];
    const cells = (values: string[], draw: typeof text) => {
      values.forEach((value, index) => draw(columns[index], leftY, 8, value));
      leftY -= 14;
    };
    const table = profile.invoice.taxTable;
    cells([table.rate, table.base, table.tax, table.gross], bold);
    totals.taxRows.forEach((row) => {
      cells([
        row.shortLabel,
        fmt.moneyPdf(row.base),
        fmt.moneyPdf(row.amount),
        fmt.moneyPdf(row.base + row.amount),
      ], text);
    });
    if (totals.exemptTotal > 0) {
      cells([
        labels.exempt,
        fmt.moneyPdf(totals.exemptTotal),
        fmt.moneyPdf(0),
        fmt.moneyPdf(totals.exemptTotal),
      ], text);
    }
    leftY -= 8;
  }

  const notesTitleY = Math.min(totalLineY - 12 - 24, leftY);
  bold(48, notesTitleY, 10, labels.notes);
  noteLines.forEach((part, index) => {
    text(48, notesTitleY - 19 - index * 14, 9, part);
  });

  const pageCount = pages.length;
  pages.forEach((pageContent, index) => {
    content = pageContent;
    text(48, 74, 9, `${profile.party.bankLabel}: ${seller.bankAccount}`);
    text(48, 48, 8, `${seller.name} | ${seller.email}`);
    text(470, 48, 8, labels.page(index + 1, pageCount));
  });

  return createPdf(
    pages.map((pageContent) => pageContent.join("\n")),
    logoImage,
  );
}
