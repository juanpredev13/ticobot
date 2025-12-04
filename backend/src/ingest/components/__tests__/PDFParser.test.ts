import { describe, it, expect, beforeEach } from 'vitest';
import { PDFParser } from '../PDFParser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PDFParser', () => {
    let parser: PDFParser;

    beforeEach(() => {
        parser = new PDFParser();
    });

    it('should parse a valid PDF file', async () => {
        const testPdfPath = path.join(__dirname, 'example.pdf');

        const result = await parser.parse(testPdfPath, 'test-doc-001');

        expect(result.documentId).toBe('test-doc-001');
        expect(result.text).toBeTruthy();
        expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should validate PDF files correctly', async () => {
        const testPdfPath = path.join(__dirname, 'example.pdf');
        const isValid = await parser.isValidPDF(testPdfPath);

        expect(isValid).toBe(true);
    });
});
