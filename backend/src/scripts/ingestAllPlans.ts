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
// Source: https://www.tse.go.cr/2026/docus/planesgobierno/
const TSE_PLANS = [
  {
    documentId: 'pln-2026',
    partyName: 'Partido Liberación Nacional',
    partyId: 'PLN',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PLN.pdf'
  },
  {
    documentId: 'pac-2026',
    partyName: 'Partido Acción Ciudadana',
    partyId: 'PAC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PAC.pdf'
  },
  {
    documentId: 'pusc-2026',
    partyName: 'Partido Unidad Social Cristiana',
    partyId: 'PUSC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PUSC.pdf'
  },
  {
    documentId: 'prsc-2026',
    partyName: 'Partido Restauración Social Cristiana',
    partyId: 'PRSC',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PRSC.pdf'
  },
  {
    documentId: 'pfa-2026',
    partyName: 'Partido Frente Amplio',
    partyId: 'PFA',
    url: 'https://www.tse.go.cr/2026/docus/planesgobierno/PFA.pdf'
  },
  // Add more parties as they become available
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
