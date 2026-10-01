// A minimal PDF writer: Helvetica text, lines, filled rectangles and one
// optional JPEG image, assembled into an uncompressed PDF 1.4 file.

export type PdfJpeg = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

export type PdfPageSize = { width: number; height: number };

export const A4: PdfPageSize = { width: 595, height: 842 };

export function createPdf(
  pageStreams: string[],
  logoImage?: PdfJpeg | null,
  pageSize: PdfPageSize = A4,
) {
  const encoder = new TextEncoder();
  const objects: Uint8Array<ArrayBuffer>[] = [];
  const addObject = (bytes: Uint8Array<ArrayBuffer>) => {
    objects.push(bytes);
    return objects.length;
  };

  // Objects 1 and 2 are the catalog and page tree; they are filled in once
  // every page object has been assigned a number.
  addObject(new Uint8Array());
  addObject(new Uint8Array());
  const regularFontId = addObject(
    encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
  );
  const boldFontId = addObject(
    encoder.encode(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ),
  );

  let logoId: number | null = null;
  if (logoImage) {
    logoId = addObject(
      concatBytes([
        encoder.encode(
          `<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.bytes.length} >>\nstream\n`,
        ),
        logoImage.bytes,
        encoder.encode("\nendstream"),
      ]),
    );
  }

  const fonts = `/Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >>`;
  const pageResources = logoId
    ? `/Resources << ${fonts} /XObject << /Logo ${logoId} 0 R >> >>`
    : `/Resources << ${fonts} >>`;
  const mediaBox = `/MediaBox [0 0 ${round(pageSize.width)} ${
    round(pageSize.height)
  }]`;

  const pageIds = pageStreams.map((stream) => {
    const streamBytes = encoder.encode(stream);
    const contentId = addObject(
      concatBytes([
        encoder.encode(`<< /Length ${streamBytes.length} >>\nstream\n`),
        streamBytes,
        encoder.encode("\nendstream"),
      ]),
    );
    return addObject(
      encoder.encode(
        `<< /Type /Page /Parent 2 0 R ${mediaBox} ${pageResources} /Contents ${contentId} 0 R >>`,
      ),
    );
  });

  objects[0] = encoder.encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[1] = encoder.encode(
    `<< /Type /Pages /Kids [${
      pageIds.map((id) => `${id} 0 R`).join(" ")
    }] /Count ${pageIds.length} >>`,
  );

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

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function parseJpegDataUrl(value: string): PdfJpeg | null {
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

export function fitImage(
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

export function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}

export function pdfText(value: string) {
  const safeValue = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

  return `(${
    safeValue
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
  })`;
}
