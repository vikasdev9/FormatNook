import { describe, it, expect } from 'vitest';
import { generatePdfReport, convertBlobToJpegBytes } from '../services/pdf-report.service';

async function readBlob(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('pdf-report.service', () => {
  it('generates a valid PDF 1.4 Blob with embedded image XObject', async () => {
    // Generate JPEG bytes
    const sampleBlob = new Blob(['sample-image-data'], { type: 'image/png' });
    const imgInfo = await convertBlobToJpegBytes(sampleBlob, 200, 150);

    const blob = generatePdfReport({
      title: 'Base64 Image Report',
      subtitle: 'Image Decode Audit',
      toolName: 'Base64 to Image Decoder',
      embeddedImage: imgInfo,
      sections: [
        {
          title: 'Image Specification',
          items: [
            { label: 'Format', value: 'PNG' },
            { label: 'Dimensions', value: '200 × 150 px' },
            { label: 'Size', value: '45,000 bytes' },
          ],
        },
      ],
      notes: ['Transformation: Normalized padding', 'Cryptographic check: Magic bytes valid'],
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');

    const text = await readBlob(blob);

    // Verify PDF 1.4 Header
    expect(text.startsWith('%PDF-1.4')).toBe(true);

    // Verify Catalog, Pages, Page
    expect(text).toContain('/Type /Catalog');
    expect(text).toContain('/Type /Pages');
    expect(text).toContain('/Type /Page');

    // Verify Resource Dictionary references the Image XObject
    expect(text).toContain('/XObject << /Im1 7 0 R >>');

    // Verify Image XObject exists with DCTDecode filter
    expect(text).toContain('7 0 obj');
    expect(text).toContain('/Type /XObject');
    expect(text).toContain('/Subtype /Image');
    expect(text).toContain('/Filter /DCTDecode');
    expect(text).toContain(`/Width ${imgInfo.width}`);
    expect(text).toContain(`/Height ${imgInfo.height}`);

    // Verify image painting command in content stream
    expect(text).toContain('/Im1 Do');

    // Verify xref table and trailer
    expect(text).toContain('xref');
    expect(text).toContain('trailer');
    expect(text.trim().endsWith('%%EOF')).toBe(true);
  });

  it('generates a clean text/table PDF when no embedded image is provided', async () => {
    const blob = generatePdfReport({
      title: 'Text Audit Report',
      toolName: 'FormatNook Test Tool',
      sections: [
        {
          title: 'Section One',
          items: [{ label: 'Item 1', value: 'Value 1' }],
        },
      ],
    });

    const text = await readBlob(blob);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).not.toContain('/Im1 Do');
    expect(text).toContain('Text Audit Report');
    expect(text.trim().endsWith('%%EOF')).toBe(true);
  });
});
