/**
 * Test script for Quality Scoring and Keyword Extraction
 * Tests Issues #32 and #33 implementations
 */

import { QualityScorer } from '../src/ingest/components/QualityScorer.js';
import { KeywordExtractor } from '../src/ingest/components/KeywordExtractor.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('TestQualityKeywords');

// Sample texts representing different quality levels
const sampleTexts = {
    excellent: `
        El gobierno propone implementar un programa integral de desarrollo sostenible
        para Costa Rica. Este plan incluye inversiones en educación superior,
        infraestructura verde, y políticas de seguridad ciudadana. La estrategia
        económica se enfoca en promover el empleo juvenil y apoyar a las pequeñas
        empresas mediante programas de capacitación y acceso a financiamiento.
        El Ministerio de Educación Pública trabajará en conjunto con el sector
        privado para garantizar que los ciudadanos tengan las herramientas necesarias
        para competir en la economía digital.
    `,

    good: `
        Propuesta de reforma al sistema de salud pública. Ampliar cobertura de la CCSS
        en zonas rurales. Inversión en hospitales regionales y centros de atención
        primaria. Programa de prevención de enfermedades crónicas.
    `,

    fair: `
        Plan para mejorar seguridad. Más policías. Mejor equipo. Trabajo con
        comunidades. Cámaras de vigilancia.
    `,

    poor: `
        @@@ ERROR ### Scann!ng d0cument... ###
        Text fr0m OCR... p@rty n@me... pl@n...
        ### NOISE ### %%% GARBLED %%%
    `,

    veryPoor: `
        a b c d e f g h i j k
    `,
};

async function testQualityScoring() {
    logger.info('='.repeat(80));
    logger.info('Testing Quality Scoring (Issue #33)');
    logger.info('='.repeat(80));

    const scorer = new QualityScorer();

    for (const [label, text] of Object.entries(sampleTexts)) {
        const metrics = scorer.calculateQuality(text.trim());
        const qualityLabel = scorer.getQualityLabel(metrics.qualityScore);
        const shouldKeep = scorer.shouldKeepChunk(metrics);

        logger.info(`\n${label.toUpperCase()} Quality Text:`);
        logger.info(`  Overall Score: ${metrics.qualityScore.toFixed(3)} (${qualityLabel})`);
        logger.info(`  Length Score: ${metrics.lengthScore.toFixed(3)}`);
        logger.info(`  Special Char Ratio: ${metrics.specialCharRatio.toFixed(3)}`);
        logger.info(`  Has Keywords: ${metrics.hasKeywords}`);
        logger.info(`  Readability: ${metrics.readability.toFixed(3)}`);
        logger.info(`  Keep Chunk: ${shouldKeep ? '✅ YES' : '❌ NO'}`);
    }
}

async function testKeywordExtraction() {
    logger.info('\n' + '='.repeat(80));
    logger.info('Testing Keyword Extraction (Issue #32)');
    logger.info('='.repeat(80));

    const extractor = new KeywordExtractor();

    // Test on the excellent quality text
    const text = sampleTexts.excellent.trim();
    const result = extractor.extract(text, 10);

    logger.info('\nExtracted from Excellent Quality Text:');
    logger.info(`\nKeywords (${result.keywords.length}):`);
    result.keywords.forEach((keyword, i) => {
        logger.info(`  ${i + 1}. ${keyword}`);
    });

    logger.info(`\nEntities (${result.entities.length}):`);
    if (result.entities.length > 0) {
        result.entities.forEach((entity, i) => {
            logger.info(`  ${i + 1}. ${entity}`);
        });
    } else {
        logger.info('  (none detected)');
    }
}

async function testRealChunk() {
    logger.info('\n' + '='.repeat(80));
    logger.info('Testing with Real Government Plan Text');
    logger.info('='.repeat(80));

    const realText = `
        El Partido Liberación Nacional propone una reforma integral del sistema educativo
        costarricense. Nuestro plan incluye aumentar el presupuesto del Ministerio de
        Educación Pública al 8% del PIB, modernizar la infraestructura de las escuelas
        en zonas rurales, e implementar programas de alfabetización digital para todos
        los estudiantes. Trabajaremos con el ICE y el MICITT para garantizar conectividad
        en todas las instituciones educativas. La CCSS proporcionará servicios de salud
        mental en los centros educativos. En materia de seguridad, fortaleceremos la
        presencia policial en San José, Alajuela, Cartago, Heredia, Guanacaste, Puntarenas
        y Limón. El objetivo es reducir la criminalidad en un 30% durante nuestra
        administración.
    `;

    const scorer = new QualityScorer();
    const extractor = new KeywordExtractor();

    const metrics = scorer.calculateQuality(realText.trim());
    const result = extractor.extract(realText.trim(), 15);

    logger.info('\nQuality Metrics:');
    logger.info(`  Score: ${metrics.qualityScore.toFixed(3)} (${scorer.getQualityLabel(metrics.qualityScore)})`);
    logger.info(`  Length: ${metrics.lengthScore.toFixed(3)}`);
    logger.info(`  Special Chars: ${metrics.specialCharRatio.toFixed(3)}`);
    logger.info(`  Has Keywords: ${metrics.hasKeywords}`);
    logger.info(`  Readability: ${metrics.readability.toFixed(3)}`);

    logger.info(`\nTop Keywords (${result.keywords.length}):`);
    result.keywords.forEach((keyword, i) => {
        logger.info(`  ${i + 1}. ${keyword}`);
    });

    logger.info(`\nExtracted Entities (${result.entities.length}):`);
    result.entities.forEach((entity, i) => {
        logger.info(`  ${i + 1}. ${entity}`);
    });
}

async function main() {
    try {
        await testQualityScoring();
        await testKeywordExtraction();
        await testRealChunk();

        logger.info('\n' + '='.repeat(80));
        logger.info('✅ All tests completed successfully!');
        logger.info('='.repeat(80));
    } catch (error) {
        logger.error('Test failed:', error);
        process.exit(1);
    }
}

main();
