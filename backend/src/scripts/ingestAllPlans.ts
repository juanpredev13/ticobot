/**
 * Ingest all TSE 2026 Government Plans
 *
 * This script downloads and processes all available government plan PDFs
 * from Costa Rica's Supreme Electoral Tribunal (TSE) for the 2026 election.
 */

import { IngestPipeline } from '../ingest/components/IngestPipeline.js';
import dotenv from 'dotenv';

dotenv.config();

// List of all political parties with government plans for 2026
// Source: Scraped from https://www.tse.go.cr/2026/planesgobierno.html
// Last updated: Auto-scraped
const TSE_PLANS = [
  {
    documentId: 'pln-2026',
    partyName: 'Partido Liberación Nacional',
    partyId: 'PLN',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf'
  },
  {
    documentId: 'pusc-2026',
    partyName: 'Partido Unidad Social Cristiana',
    partyId: 'PUSC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PUSC.pdf'
  },
  {
    documentId: 'fa-2026',
    partyName: 'Partido Frente Amplio',
    partyId: 'FA',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/FA.pdf'
  },
  {
    documentId: 'plp-2026',
    partyName: 'Partido Liberación Progresista',
    partyId: 'PLP',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PLP.pdf'
  },
  {
    documentId: 'png-2026',
    partyName: 'Partido Nueva Generación',
    partyId: 'PNG',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PNG.pdf'
  },
  {
    documentId: 'acrm-2026',
    partyName: 'Alianza por Costa Rica Mía',
    partyId: 'ACRM',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/ACRM.pdf'
  },
  {
    documentId: 'pa-2026',
    partyName: 'Partido Alianza',
    partyId: 'PA',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PA.pdf'
  },
  {
    documentId: 'cds-2026',
    partyName: 'Coalición Democrática Social',
    partyId: 'CDS',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/CDS.pdf'
  },
  {
    documentId: 'cac-2026',
    partyName: 'Coalición Acción Ciudadana',
    partyId: 'CAC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/CAC.pdf'
  },
  {
    documentId: 'pdlct-2026',
    partyName: 'Partido Demócrata Liberal Costarricense',
    partyId: 'PDLCT',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PDLCT.pdf'
  },
  {
    documentId: 'pen-2026',
    partyName: 'Partido Encuentro Nacional',
    partyId: 'PEN',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PEN.pdf'
  },
  {
    documentId: 'pel-2026',
    partyName: 'Partido Ecológico',
    partyId: 'PEL',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PEL.pdf'
  },
  {
    documentId: 'pin-2026',
    partyName: 'Partido Integración Nacional',
    partyId: 'PIN',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PIN.pdf'
  },
  {
    documentId: 'pjsc-2026',
    partyName: 'Partido Justicia Social Costarricense',
    partyId: 'PJSC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PJSC.pdf'
  },
  {
    documentId: 'pnr-2026',
    partyName: 'Partido Nueva República',
    partyId: 'PNR',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PNR.pdf'
  },
  {
    documentId: 'psd-2026',
    partyName: 'Partido Social Demócrata',
    partyId: 'PSD',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PSD.pdf'
  },
  {
    documentId: 'ppso-2026',
    partyName: 'Partido Progreso Social',
    partyId: 'PPSO',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PPSO.pdf'
  },
  {
    documentId: 'up-2026',
    partyName: 'Unión Patriótica',
    partyId: 'UP',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/UP.pdf'
  },
  {
    documentId: 'pucd-2026',
    partyName: 'Partido Unión Costarricense Demócrata',
    partyId: 'PUCD',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PUCD.pdf'
  },
  {
    documentId: 'cr1-2026',
    partyName: 'Coalición CR1',
    partyId: 'CR1',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/CR1.pdf'
  },
];

async function main() {
  console.log('📥 Starting batch ingestion of TSE 2026 Government Plans');
  console.log(`   Total plans to process: ${TSE_PLANS.length}\n`);

  const pipeline = new IngestPipeline();
  const results = [];
  let successCount = 0;
  let failCount = 0;

  const overallStartTime = Date.now();

  for (let i = 0; i < TSE_PLANS.length; i++) {
    const plan = TSE_PLANS[i];
    const planNum = i + 1;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 Processing ${planNum}/${TSE_PLANS.length}: ${plan.partyName} (${plan.partyId})`);
    console.log(`${'='.repeat(80)}\n`);

    const startTime = Date.now();

    try {
      const result = await pipeline.ingest(
        plan.url,
        plan.documentId,
        {
          generateEmbeddings: true,
          storeInVectorDB: true,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        successCount++;
        console.log(`\n✅ SUCCESS - ${plan.partyId}`);
        console.log(`   Chunks: ${result.chunks?.length || 0}`);
        console.log(`   Time: ${(duration / 1000).toFixed(1)}s`);
      } else {
        failCount++;
        console.log(`\n❌ FAILED - ${plan.partyId}`);
        console.log(`   Error: ${result.error}`);
      }

      results.push({
        ...plan,
        success: result.success,
        chunks: result.chunks?.length || 0,
        duration,
        error: result.error,
      });

    } catch (error) {
      failCount++;
      const duration = Date.now() - startTime;
      console.log(`\n❌ EXCEPTION - ${plan.partyId}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);

      results.push({
        ...plan,
        success: false,
        chunks: 0,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  pipeline.dispose();

  const totalDuration = Date.now() - overallStartTime;

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 BATCH INGESTION SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  console.log(`Total plans processed: ${TSE_PLANS.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000 / 60).toFixed(1)} minutes\n`);

  console.log('Detailed results:\n');
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    const time = (r.duration / 1000).toFixed(1);
    console.log(`${status} ${r.partyId.padEnd(6)} | ${r.chunks.toString().padStart(3)} chunks | ${time.padStart(5)}s | ${r.partyName}`);
    if (!r.success && r.error) {
      console.log(`   └─ Error: ${r.error.substring(0, 100)}...`);
    }
  });

  const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
  console.log(`\n📦 Total chunks created: ${totalChunks}`);
  console.log(`📈 Average chunks per plan: ${(totalChunks / successCount).toFixed(0)}`);

  if (failCount === 0) {
    console.log(`\n🎉 All plans ingested successfully!`);
  } else {
    console.log(`\n⚠️  ${failCount} plan(s) failed. Check errors above.`);
  }

  console.log('\n✅ Batch ingestion complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Fatal error during batch ingestion:');
  console.error(error);
  process.exit(1);
});
