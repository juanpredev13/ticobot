#!/usr/bin/env tsx
/**
 * Scrape TSE Government Plans Page
 * 
 * This script scrapes the TSE government plans page to find all available PDFs
 * and their correct URLs.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const TSE_PLANS_URL = 'https://www.tse.go.cr/2026/planesgobierno.html';

interface PlanInfo {
  partyName: string;
  partyId: string;
  pdfUrl: string;
  documentId: string;
}

async function scrapeTSEPlans(): Promise<PlanInfo[]> {
  console.log('🔍 Scraping TSE Government Plans page...');
  console.log(`📍 URL: ${TSE_PLANS_URL}\n`);

  try {
    // Fetch the page
    const response = await axios.get(TSE_PLANS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const plans: PlanInfo[] = [];

    // Look for PDF links - common patterns:
    // - <a href="...pdf">...</a>
    // - Links containing "plan" or "gobierno"
    // - Links in tables or lists

    console.log('📄 Searching for PDF links...\n');

    // Method 1: Find all links to PDF files
    $('a[href$=".pdf"], a[href*=".pdf"]').each((index, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().trim();

      if (href) {
        // Resolve relative URLs
        const pdfUrl = href.startsWith('http') 
          ? href 
          : new URL(href, TSE_PLANS_URL).toString();

        // Try to extract party name from link text or nearby elements
        const partyName = text || $link.closest('td, li, div').text().trim() || 'Unknown';
        
        // Try to extract party ID from URL or text
        let partyId = 'UNKNOWN';
        const urlMatch = pdfUrl.match(/([A-Z]{2,5})\.pdf/i);
        if (urlMatch) {
          partyId = urlMatch[1].toUpperCase();
        } else {
          // Try to extract from party name
          const nameMatch = partyName.match(/(PLN|PAC|PUSC|PRSC|PFA|PPSD|PLP|PNG|PPS|PAS|PPSD|PPS|PPSD)/i);
          if (nameMatch) {
            partyId = nameMatch[1].toUpperCase();
          }
        }

        const documentId = `${partyId.toLowerCase()}-2026`;

        plans.push({
          partyName,
          partyId,
          pdfUrl,
          documentId
        });

        console.log(`✅ Found: ${partyId} - ${partyName}`);
        console.log(`   URL: ${pdfUrl}\n`);
      }
    });

    // Method 2: Look for links in tables (common pattern for TSE)
    if (plans.length === 0) {
      console.log('🔍 Trying alternative method: searching in tables...\n');
      
      $('table a, .table a, [class*="table"] a').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        
        if (href && (href.includes('.pdf') || href.includes('plan') || href.includes('gobierno'))) {
          const pdfUrl = href.startsWith('http') 
            ? href 
            : new URL(href, TSE_PLANS_URL).toString();
          
          const text = $link.text().trim();
          const rowText = $link.closest('tr, td').text().trim();
          
          let partyName = text || rowText || 'Unknown';
          let partyId = 'UNKNOWN';
          
          const urlMatch = pdfUrl.match(/([A-Z]{2,5})\.pdf/i);
          if (urlMatch) {
            partyId = urlMatch[1].toUpperCase();
          }
          
          const documentId = `${partyId.toLowerCase()}-2026`;

          // Avoid duplicates
          if (!plans.find(p => p.pdfUrl === pdfUrl)) {
            plans.push({
              partyName,
              partyId,
              pdfUrl,
              documentId
            });

            console.log(`✅ Found: ${partyId} - ${partyName}`);
            console.log(`   URL: ${pdfUrl}\n`);
          }
        }
      });
    }

    // Method 3: Look for any PDF links in the page
    if (plans.length === 0) {
      console.log('🔍 Trying method 3: searching all links...\n');
      
      $('a').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        
        if (href && href.includes('.pdf')) {
          const pdfUrl = href.startsWith('http') 
            ? href 
            : new URL(href, TSE_PLANS_URL).toString();
          
          const text = $link.text().trim();
          const context = $link.parent().text().trim();
          
          let partyName = text || context || 'Unknown';
          let partyId = 'UNKNOWN';
          
          const urlMatch = pdfUrl.match(/([A-Z]{2,5})\.pdf/i);
          if (urlMatch) {
            partyId = urlMatch[1].toUpperCase();
          }
          
          const documentId = `${partyId.toLowerCase()}-2026`;

          // Avoid duplicates
          if (!plans.find(p => p.pdfUrl === pdfUrl)) {
            plans.push({
              partyName,
              partyId,
              pdfUrl,
              documentId
            });

            console.log(`✅ Found: ${partyId} - ${partyName}`);
            console.log(`   URL: ${pdfUrl}\n`);
          }
        }
      });
    }

    return plans;

  } catch (error) {
    console.error('❌ Error scraping TSE page:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    throw error;
  }
}

async function saveResults(plans: PlanInfo[]) {
  const outputPath = path.join(process.cwd(), 'scraped-plans.json');
  
  await fs.writeFile(
    outputPath,
    JSON.stringify(plans, null, 2),
    'utf-8'
  );

  console.log(`\n💾 Results saved to: ${outputPath}\n`);
}

async function generateIngestScript(plans: PlanInfo[]) {
  const scriptContent = `/**
 * Auto-generated from TSE scraping
 * Generated: ${new Date().toISOString()}
 */

export const TSE_PLANS = ${JSON.stringify(plans, null, 2)};
`;

  const outputPath = path.join(process.cwd(), 'scraped-plans.ts');
  
  await fs.writeFile(
    outputPath,
    scriptContent,
    'utf-8'
  );

  console.log(`📝 TypeScript export saved to: ${outputPath}\n`);
}

async function main() {
  console.log('🚀 TSE Government Plans Scraper\n');
  console.log('='.repeat(80));
  console.log();

  try {
    const plans = await scrapeTSEPlans();

    console.log('='.repeat(80));
    console.log(`\n📊 Summary: Found ${plans.length} PDF(s)\n`);

    if (plans.length === 0) {
      console.log('⚠️  No PDFs found. The page structure might have changed.');
      console.log('💡 Try inspecting the page manually or check the HTML structure.\n');
    } else {
      // Save results
      await saveResults(plans);
      await generateIngestScript(plans);

      // Display summary table
      console.log('📋 Found Plans:');
      console.log('-'.repeat(80));
      plans.forEach((plan, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${plan.partyId.padEnd(6)} | ${plan.partyName}`);
        console.log(`    ${plan.pdfUrl}`);
      });
      console.log('-'.repeat(80));
      console.log();
    }

  } catch (error) {
    console.error('\n❌ Fatal error:');
    console.error(error);
    process.exit(1);
  }
}

main();


