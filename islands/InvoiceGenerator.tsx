import { useMemo, useState } from "preact/hooks";

type VatRate = "21" | "9" | "0" | "exempt";

type LineItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
};

type Party = {
  name: string;
  address: string;
  postalCity: string;
  country: string;
  email: string;
  taxId: string;
};

type InvoiceState = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerm: string;
  reference: string;
  logoDataUrl: string;
  seller: Party & {
    kvk: string;
    iban: string;
  };
  customer: Party;
  notes: string;
  items: LineItem[];
};

const VAT_OPTIONS: Array<{ value: VatRate; label: string }> = [
  { value: "21", label: "21% VAT" },
  { value: "9", label: "9% VAT" },
  { value: "0", label: "0% VAT" },
  { value: "exempt", label: "Exempt" },
];

const today = new Date();
const defaultDueDate = new Date(today);
defaultDueDate.setDate(defaultDueDate.getDate() + 14);

const initialInvoice: InvoiceState = {
  invoiceNumber: "2026-001",
  invoiceDate: toInputDate(today),
  dueDate: toInputDate(defaultDueDate),
  paymentTerm: "14 dagen",
  reference: "Websiteproject",
  logoDataUrl: "",
  seller: {
    name: "Studio Voorbeeld B.V.",
    address: "Keizersgracht 100",
    postalCity: "1015 CV Amsterdam",
    country: "Nederland",
    email: "facturen@voorbeeld.nl",
    taxId: "NL123456789B01",
    kvk: "12345678",
    iban: "NL91 ABNA 0417 1643 00",
  },
  customer: {
    name: "Klant Bedrijf B.V.",
    address: "Coolsingel 42",
    postalCity: "3011 AD Rotterdam",
    country: "Nederland",
    email: "administratie@klant.nl",
    taxId: "NL987654321B01",
  },
  notes:
    "Gelieve het totaalbedrag te voldoen onder vermelding van het factuurnummer.",
  items: [
    {
      id: 1,
      description: "Ontwerp en ontwikkeling",
      quantity: 1,
      unitPrice: 1250,
      vatRate: "21",
    },
    {
      id: 2,
      description: "Drukwerk",
      quantity: 2,
      unitPrice: 85,
      vatRate: "9",
    },
  ],
};

export default function InvoiceGenerator() {
  const [invoice, setInvoice] = useState<InvoiceState>(initialInvoice);
  const [previewOpen, setPreviewOpen] = useState(false);
  const totals = useMemo(() => calculateTotals(invoice.items), [invoice.items]);

  const updateInvoice = <K extends keyof InvoiceState>(
    key: K,
    value: InvoiceState[K],
  ) => {
    setInvoice((current) => ({ ...current, [key]: value }));
  };

  const updateParty = (
    party: "seller" | "customer",
    key: string,
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
    setInvoice((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: Date.now(),
          description: "Nieuwe factuurregel",
          quantity: 1,
          unitPrice: 0,
          vatRate: "21",
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

  const updateLogo = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      updateInvoice("logoDataUrl", String(reader.result ?? ""));
    });
    reader.readAsDataURL(file);
  };

  const downloadPdf = () => {
    const pdf = buildPdf(invoice, totals);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factuur-${invoice.invoiceNumber || "concept"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main class="invoice-app">
      <section class="editor-panel" aria-label="Invoice details">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Dutch invoice</p>
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

        <section class="logo-editor" aria-label="Logo">
          <div>
            <h2>Logo</h2>
            <p>Upload a JPEG logo for the generated invoice preview and PDF.</p>
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
            {invoice.logoDataUrl && (
              <button
                type="button"
                class="secondary-button"
                onClick={() => updateInvoice("logoDataUrl", "")}
              >
                Remove
              </button>
            )}
          </div>
          <div class="logo-preview-box">
            {invoice.logoDataUrl
              ? <img src={invoice.logoDataUrl} alt="Uploaded logo" />
              : <span>NL</span>}
          </div>
        </section>

        <div class="form-grid">
          <label>
            Invoice number
            <input
              value={invoice.invoiceNumber}
              onInput={(event) =>
                updateInvoice(
                  "invoiceNumber",
                  event.currentTarget.value,
                )}
            />
          </label>
          <label>
            Invoice date
            <input
              type="date"
              value={invoice.invoiceDate}
              onInput={(event) =>
                updateInvoice("invoiceDate", event.currentTarget.value)}
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={invoice.dueDate}
              onInput={(event) =>
                updateInvoice("dueDate", event.currentTarget.value)}
            />
          </label>
          <label>
            Payment term
            <input
              value={invoice.paymentTerm}
              onInput={(event) =>
                updateInvoice("paymentTerm", event.currentTarget.value)}
            />
          </label>
          <label>
            Reference
            <input
              value={invoice.reference}
              onInput={(event) =>
                updateInvoice("reference", event.currentTarget.value)}
            />
          </label>
        </div>

        <div class="party-grid">
          <PartyFields
            title="From"
            party={invoice.seller}
            onChange={(key, value) => updateParty("seller", key, value)}
            seller
          />
          <PartyFields
            title="Bill to"
            party={invoice.customer}
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
              <span>Price</span>
              <span>VAT</span>
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
          Note
          <textarea
            rows={3}
            value={invoice.notes}
            onInput={(event) =>
              updateInvoice("notes", event.currentTarget.value)}
          />
        </label>
      </section>

      <section class="preview-panel" aria-label="Invoice preview">
        <InvoicePaper invoice={invoice} totals={totals} />
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
            <InvoicePaper invoice={invoice} totals={totals} />
          </div>
        </div>
      )}
    </main>
  );
}

function PartyFields(
  props: {
    title: string;
    party: Party & Partial<{ kvk: string; iban: string }>;
    seller?: boolean;
    onChange: (key: string, value: string) => void;
  },
) {
  return (
    <section class="party-fields">
      <h2>{props.title}</h2>
      <label>
        Company name
        <input
          value={props.party.name}
          onInput={(event) => props.onChange("name", event.currentTarget.value)}
        />
      </label>
      <label>
        Address
        <input
          value={props.party.address}
          onInput={(event) =>
            props.onChange("address", event.currentTarget.value)}
        />
      </label>
      <label>
        Postal code and city
        <input
          value={props.party.postalCity}
          onInput={(event) =>
            props.onChange("postalCity", event.currentTarget.value)}
        />
      </label>
      <label>
        Country
        <input
          value={props.party.country}
          onInput={(event) =>
            props.onChange("country", event.currentTarget.value)}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={props.party.email}
          onInput={(event) =>
            props.onChange("email", event.currentTarget.value)}
        />
      </label>
      <label>
        VAT number
        <input
          value={props.party.taxId}
          onInput={(event) =>
            props.onChange("taxId", event.currentTarget.value)}
        />
      </label>
      {props.seller && (
        <>
          <label>
            KvK
            <input
              value={props.party.kvk}
              onInput={(event) =>
                props.onChange("kvk", event.currentTarget.value)}
            />
          </label>
          <label>
            IBAN
            <input
              value={props.party.iban}
              onInput={(event) =>
                props.onChange("iban", event.currentTarget.value)}
            />
          </label>
        </>
      )}
    </section>
  );
}

function InvoicePaper(
  props: { invoice: InvoiceState; totals: ReturnType<typeof calculateTotals> },
) {
  const { invoice, totals } = props;

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
              NL
            </div>
          )}
        <div class="invoice-title">
          <p>Factuur</p>
          <h2>{invoice.invoiceNumber}</h2>
        </div>
      </header>

      <section class="invoice-addresses">
        <AddressBlock title="Van" party={invoice.seller} seller />
        <AddressBlock title="Factuur aan" party={invoice.customer} />
      </section>

      <section class="invoice-meta">
        <Meta label="Factuurdatum" value={formatDate(invoice.invoiceDate)} />
        <Meta label="Vervaldatum" value={formatDate(invoice.dueDate)} />
        <Meta label="Betalingstermijn" value={invoice.paymentTerm} />
        <Meta label="Referentie" value={invoice.reference} />
      </section>

      <div class="invoice-table">
        <div class="invoice-table-head">
          <span>Omschrijving</span>
          <span>Aantal</span>
          <span>Prijs</span>
          <span>Btw</span>
          <span>Totaal</span>
        </div>
        {invoice.items.map((item) => {
          const lineNet = item.quantity * item.unitPrice;
          return (
            <div class="invoice-table-row" key={item.id}>
              <span>{item.description}</span>
              <span>{formatQuantity(item.quantity)}</span>
              <span>{formatMoney(item.unitPrice)}</span>
              <span>{vatLabel(item.vatRate)}</span>
              <span>{formatMoney(lineNet)}</span>
            </div>
          );
        })}
      </div>

      <section class="invoice-bottom">
        <div class="invoice-note">
          <h3>Notitie</h3>
          <p>{invoice.notes}</p>
          <p class="bank-line">IBAN: {invoice.seller.iban}</p>
        </div>
        <div class="totals-box">
          <TotalRow label="Subtotaal" value={formatMoney(totals.subtotal)} />
          {totals.vatRows.map((row) => (
            <TotalRow
              key={row.label}
              label={`Btw ${row.label}`}
              value={formatMoney(row.amount)}
            />
          ))}
          {totals.exemptTotal > 0 && (
            <TotalRow
              label="Vrijgesteld"
              value={formatMoney(totals.exemptTotal)}
            />
          )}
          <div class="grand-total">
            <span>Totaal</span>
            <strong>{formatMoney(totals.total)}</strong>
          </div>
        </div>
      </section>

      <footer class="invoice-footer">
        <span>{invoice.seller.name}</span>
        <span>KvK {invoice.seller.kvk}</span>
        <span>Btw {invoice.seller.taxId}</span>
        <span>{invoice.seller.email}</span>
      </footer>
    </article>
  );
}

function AddressBlock(
  props: {
    title: string;
    party: Party & Partial<{ kvk: string; iban: string }>;
    seller?: boolean;
  },
) {
  return (
    <div>
      <h3>{props.title}</h3>
      <p class="address-name">{props.party.name}</p>
      <p>{props.party.address}</p>
      <p>{props.party.postalCity}</p>
      <p>{props.party.country}</p>
      <p>{props.party.email}</p>
      <p>Btw: {props.party.taxId}</p>
      {props.seller && <p>KvK: {props.party.kvk}</p>}
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

export function calculateTotals(items: LineItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const buckets = new Map<VatRate, number>();
  let exemptTotal = 0;

  for (const item of items) {
    const net = item.quantity * item.unitPrice;
    if (item.vatRate === "exempt") {
      exemptTotal += net;
      continue;
    }
    const rate = Number(item.vatRate) / 100;
    buckets.set(item.vatRate, (buckets.get(item.vatRate) ?? 0) + net * rate);
  }

  const vatRows = Array.from(buckets.entries())
    .filter(([, amount]) => amount > 0)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([rate, amount]) => ({ label: `${rate}%`, amount }));

  const vatTotal = vatRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    subtotal,
    exemptTotal,
    vatRows,
    vatTotal,
    total: subtotal + vatTotal,
  };
}

export function buildPdf(
  invoice: InvoiceState,
  totals: ReturnType<typeof calculateTotals>,
) {
  const content: string[] = [];
  const logoImage = parseJpegDataUrl(invoice.logoDataUrl);
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

  if (logoImage) {
    const logoBox = fitImage(logoImage.width, logoImage.height, 132, 46);
    image("Logo", 48, 786 - logoBox.height, logoBox.width, logoBox.height);
  } else {
    bold(48, 785, 30, "Factuur");
    text(48, 760, 11, invoice.invoiceNumber);
  }
  if (logoImage) {
    bold(48, 718, 22, "Factuur");
    text(48, 697, 10, invoice.invoiceNumber);
  }
  bold(380, 785, 13, invoice.seller.name);
  text(380, 766, 10, invoice.seller.address);
  text(380, 752, 10, invoice.seller.postalCity);
  text(380, 738, 10, invoice.seller.country);
  text(380, 724, 10, `Btw ${invoice.seller.taxId}`);
  text(380, 710, 10, `KvK ${invoice.seller.kvk}`);
  text(380, 696, 10, invoice.seller.email);

  fillRect(48, 646, 500, 38, 0.94);
  bold(62, 664, 10, "Factuur aan");
  bold(320, 664, 10, "Factuurgegevens");
  text(62, 620, 10, invoice.customer.name);
  text(62, 606, 10, invoice.customer.address);
  text(62, 592, 10, invoice.customer.postalCity);
  text(62, 578, 10, invoice.customer.country);
  text(62, 564, 10, `Btw ${invoice.customer.taxId}`);
  text(320, 620, 10, `Datum: ${formatDate(invoice.invoiceDate)}`);
  text(320, 606, 10, `Vervaldatum: ${formatDate(invoice.dueDate)}`);
  text(320, 592, 10, `Termijn: ${invoice.paymentTerm}`);
  text(320, 578, 10, `Referentie: ${invoice.reference}`);

  fillRect(48, 535, 500, 24, 0.18);
  content.push("1 1 1 rg");
  bold(60, 543, 9, "Omschrijving");
  bold(280, 543, 9, "Aantal");
  bold(340, 543, 9, "Prijs");
  bold(410, 543, 9, "Btw");
  bold(480, 543, 9, "Totaal");
  content.push("0 0 0 rg");

  let y = 512;
  invoice.items.slice(0, 12).forEach((item) => {
    const lineTotal = item.quantity * item.unitPrice;
    text(60, y, 9, truncate(item.description, 36));
    text(284, y, 9, formatQuantity(item.quantity));
    text(340, y, 9, formatMoneyPdf(item.unitPrice));
    text(414, y, 9, vatLabel(item.vatRate));
    text(474, y, 9, formatMoneyPdf(lineTotal));
    line(48, y - 9, 548, y - 9);
    y -= 28;
  });

  if (invoice.items.length > 12) {
    text(60, y, 9, `${invoice.items.length - 12} extra regels niet getoond`);
  }

  const totalsY = 190;
  line(320, totalsY + 82, 548, totalsY + 82);
  text(330, totalsY + 58, 10, "Subtotaal");
  bold(464, totalsY + 58, 10, formatMoneyPdf(totals.subtotal));
  let totalLineY = totalsY + 38;
  totals.vatRows.forEach((row) => {
    text(330, totalLineY, 10, `Btw ${row.label}`);
    bold(464, totalLineY, 10, formatMoneyPdf(row.amount));
    totalLineY -= 18;
  });
  if (totals.exemptTotal > 0) {
    text(330, totalLineY, 10, "Vrijgesteld");
    bold(464, totalLineY, 10, formatMoneyPdf(totals.exemptTotal));
    totalLineY -= 18;
  }
  totalLineY -= 8;
  fillRect(320, totalLineY - 12, 228, 28, 0.18);
  content.push("1 1 1 rg");
  bold(330, totalLineY - 2, 11, "Totaal");
  bold(454, totalLineY - 2, 11, formatMoneyPdf(totals.total));
  content.push("0 0 0 rg");

  bold(48, 145, 10, "Notitie");
  wrapText(invoice.notes, 68).forEach((part, index) => {
    text(48, 126 - index * 14, 9, part);
  });
  text(48, 74, 9, `IBAN: ${invoice.seller.iban}`);
  text(48, 48, 8, `${invoice.seller.name} | ${invoice.seller.email}`);

  return createPdf(content.join("\n"), logoImage);
}

function createPdf(stream: string, logoImage?: PdfJpeg | null) {
  const encoder = new TextEncoder();
  const pageResources = logoImage
    ? "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Logo 7 0 R >> >>"
    : "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >>";
  const streamBytes = encoder.encode(stream);
  const objects = [
    encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"),
    encoder.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    encoder.encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ${pageResources} /Contents 6 0 R >>`,
    ),
    encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    encoder.encode(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ),
    concatBytes([
      encoder.encode(`<< /Length ${streamBytes.length} >>\nstream\n`),
      streamBytes,
      encoder.encode("\nendstream"),
    ]),
  ];

  if (logoImage) {
    objects.push(
      concatBytes([
        encoder.encode(
          `<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.bytes.length} >>\nstream\n`,
        ),
        logoImage.bytes,
        encoder.encode("\nendstream"),
      ]),
    );
  }

  const chunks = [encoder.encode("%PDF-1.4\n")];
  let byteOffset = chunks[0].length;
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    const prefix = encoder.encode(`${index + 1} 0 obj\n`);
    const suffix = encoder.encode("\nendobj\n");
    offsets.push(byteOffset);
    chunks.push(prefix, object, suffix);
    byteOffset += prefix.length + object.length + suffix.length;
  });

  const xrefOffset = byteOffset;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encoder.encode(xref));

  return concatBytes(chunks);
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function vatLabel(rate: VatRate) {
  return rate === "exempt" ? "Vrijgesteld" : `${rate}%`;
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("nl-NL").format(new Date(`${value}T00:00:00`));
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatMoneyPdf(value: number) {
  return `EUR ${
    new Intl.NumberFormat("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }`;
}

type PdfJpeg = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

function parseJpegDataUrl(value: string): PdfJpeg | null {
  const match = value.match(/^data:image\/jpe?g;base64,(.+)$/);
  if (!match) return null;

  const bytes = base64ToBytes(match[1]);
  const size = getJpegSize(bytes);
  if (!size) return null;

  return { bytes, ...size };
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getJpegSize(bytes: Uint8Array) {
  let index = 2;

  while (index < bytes.length) {
    if (bytes[index] !== 0xff) return null;

    const marker = bytes[index + 1];
    const length = (bytes[index + 2] << 8) + bytes[index + 3];
    if (
      marker === 0xc0 || marker === 0xc1 || marker === 0xc2 ||
      marker === 0xc3
    ) {
      return {
        height: (bytes[index + 5] << 8) + bytes[index + 6],
        width: (bytes[index + 7] << 8) + bytes[index + 8],
      };
    }

    index += 2 + length;
  }

  return null;
}

function fitImage(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: width * scale,
    height: height * scale,
  };
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}

function pdfText(value: string) {
  const safeValue = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

  return `(${
    safeValue
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
  })`;
}

function wrapText(value: string, maxLength: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if ((current + " " + word).trim().length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 3)}...`
    : value;
}
