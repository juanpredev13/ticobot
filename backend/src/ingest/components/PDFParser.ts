import { PDFParse } from "pdf-parse";
import { readFile } from "fs/promises";
import { Logger } from "@ticobot/shared";

export interface PDFParseResult {
  documentId: string;
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export class PDFParser {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("PDFParser");
  }

  /**
   * Parse a PDF file and extract text content
   * @param filePath - Path to the PDF file
   * @param documentId - Unique identifier for the document
   * @returns Parsed document with text and metadata
   */
  async parse(filePath: string, documentId: string): Promise<PDFParseResult> {
    this.logger.info(`Parsing PDF: ${documentId}`);

    try {
      // Read file buffer
      const buffer = await readFile(filePath);

      // Create PDFParse instance with buffer data
      const parser = new PDFParse({ data: buffer });

      // Get text content
      const textResult = await parser.getText();

      // Get document info/metadata
      const infoResult = await parser.getInfo();

      this.logger.info(
        `Successfully parsed PDF: ${documentId} (${textResult.total} pages)`
      );

      const result = {
        documentId,
        text: textResult.text,
        pageCount: textResult.total,
        metadata: {
          title: infoResult.info?.Title,
          author: infoResult.info?.Author,
          subject: infoResult.info?.Subject,
          keywords: infoResult.info?.Keywords,
          creator: infoResult.info?.Creator,
          producer: infoResult.info?.Producer,
          creationDate: infoResult.info?.CreationDate
            ? new Date(infoResult.info.CreationDate)
            : undefined,
          modificationDate: infoResult.info?.ModDate
            ? new Date(infoResult.info.ModDate)
            : undefined,
        },
      };

      // Always destroy parser to free memory
      await parser.destroy();

      return result;
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${documentId}`, error);
      throw new Error(
        `PDF parsing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate that a file is a valid PDF
   * @param filePath - Path to check
   * @returns true if valid PDF
   */
  async isValidPDF(filePath: string): Promise<boolean> {
    try {
      // Use pdf-parse v2's getHeader utility
      const { getHeader } = await import("pdf-parse/node");
      const header = await getHeader(filePath);

      // If we successfully got the header, it's a valid PDF
      return header !== null;
    } catch (error) {
      this.logger.error(`PDF validation failed: ${filePath}`, error);
      return false;
    }
  }

}
