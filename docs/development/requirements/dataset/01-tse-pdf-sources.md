# TSE PDF Sources - 2026 Government Plans

## Overview

This document catalogs all official government plan PDFs from Costa Rica's Supreme Electoral Tribunal (TSE) for the 2026 presidential election.

**Total Parties**: 20
**Base URL**: https://www.tse.go.cr/2026/docus/planesgobierno/
**Last Updated**: 2025-11-18

---

## Complete Party List

| # | Party Code | PDF Filename | PDF Size | URL |
|---|------------|--------------|----------|-----|
| 01 | CR1 | 01_CR1.pdf | 819 KB | https://www.tse.go.cr/2026/docus/planesgobierno/CR1.pdf |
| 02 | ACRM | 02_ACRM.pdf | 1.9 MB | https://www.tse.go.cr/2026/docus/planesgobierno/ACRM.pdf |
| 03 | PA | 03_PA.pdf | 896 KB | https://www.tse.go.cr/2026/docus/planesgobierno/PA.pdf |
| 04 | CDS | 04_CDS.pdf | 1.9 MB | https://www.tse.go.cr/2026/docus/planesgobierno/CDS.pdf |
| 05 | CAC | 05_CAC.pdf | 1.2 MB | https://www.tse.go.cr/2026/docus/planesgobierno/CAC.pdf |
| 06 | PDLCT | 06_PDLCT.pdf | 948 KB | https://www.tse.go.cr/2026/docus/planesgobierno/PDLCT.pdf |
| 07 | PEN | 07_PEN.pdf | 2.3 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PEN.pdf |
| 08 | PEL | 08_PEL.pdf | 876 KB | https://www.tse.go.cr/2026/docus/planesgobierno/PEL.pdf |
| 09 | FA | 09_FA.pdf | 4.4 MB | https://www.tse.go.cr/2026/docus/planesgobierno/FA.pdf |
| 10 | PIN | 10_PIN.pdf | 4.9 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PIN.pdf |
| 11 | PJSC | 11_PJSC.pdf | 1.2 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PJSC.pdf |
| 12 | PLN | 12_PLN.pdf | 647 KB | https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf |
| 13 | PLP | 13_PLP.pdf | 2.9 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PLP.pdf |
| 14 | PNG | 14_PNG.pdf | 7.1 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PNG.pdf |
| 15 | PNR | 15_PNR.pdf | 6.0 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PNR.pdf |
| 16 | PSD | 16_PSD.pdf | 1.1 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PSD.pdf |
| 17 | PPSO | 17_PPSO.pdf | 6.4 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PPSO.pdf |
| 18 | PUSC | 18_PUSC.pdf | 1.1 MB | https://www.tse.go.cr/2026/docus/planesgobierno/PUSC.pdf |
| 19 | UP | 19_UP.pdf | 5.3 MB | https://www.tse.go.cr/2026/docus/planesgobierno/UP.pdf |
| 20 | PUCD | 20_PUCD.pdf | 238 KB | https://www.tse.go.cr/2026/docus/planesgobierno/PUCD.pdf |

**Total Size**: 52 MB

---

## Party Details

To be enhanced with:
- Full party names (Partido Liberación Nacional, etc.)
- Presidential candidate names
- Vice-presidential candidate names
- Party websites
- Party colors/logos

---

## Download Metadata Schema

Current metadata captured during download:

```json
{
  "url": "string",          // Source URL on TSE website
  "party": "string",        // Party abbreviation/code
  "filename": "string",     // Local filename
  "downloadedAt": "string"  // ISO 8601 timestamp
}
```

---

## Data Characteristics

### PDF Size Distribution
- **Smallest**: PUCD (238 KB)
- **Largest**: PNG (7.1 MB)
- **Average**: ~2.6 MB
- **Median**: ~1.5 MB

### Estimated Page Counts
Based on typical PDF sizes:
- Small PDFs (< 1 MB): ~10-30 pages
- Medium PDFs (1-3 MB): ~30-100 pages
- Large PDFs (> 3 MB): ~100-300 pages

**Estimated Total**: 1,000-2,000 pages across all documents

---

## Access Patterns

### Download Strategy
- All PDFs downloaded from official TSE website
- Sequential download with respectful rate limiting
- Checksums/timestamps tracked for update detection
- Original PDFs preserved for re-processing

### Update Detection
- Check TSE website daily for PDF changes
- Compare file sizes and last-modified headers
- Re-download if changes detected
- Trigger re-ingestion pipeline

---

## Known Issues & Considerations

### PDF Quality Variations
- Some PDFs may be scanned documents (OCR required)
- Encoding may vary (UTF-8, Latin-1, etc.)
- Some may contain images/tables that require special handling
- Document structure not standardized across parties

### Language
- Primary language: Spanish (Costa Rican dialect)
- Some may include technical terms, acronyms
- Proper names of people, places, institutions

### Content Structure
- No standardized template across parties
- Varying levels of detail and organization
- Different formatting styles
- Some may include graphics, charts, tables

---

## Compliance & Attribution

### Source
All PDFs are official documents published by:
**Tribunal Supremo de Elecciones de Costa Rica (TSE)**
Website: https://www.tse.go.cr

### Legal Status
- These are public domain government documents
- Required by law for all presidential candidates
- Legally binding campaign commitments

### Attribution Requirements
When displaying content from these PDFs:
- Cite the party name
- Include page number reference
- Link back to original PDF on TSE website
- Note the 2026 election year

---

## Next Steps

1. Enhance metadata with full party names and candidate information
2. Extract page counts from actual PDFs
3. Identify which PDFs require OCR
4. Create party information database
5. Set up automated update monitoring
