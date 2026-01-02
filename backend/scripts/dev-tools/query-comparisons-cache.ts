#!/usr/bin/env tsx

/**
 * Query comparisons_cache table in Supabase
 * 
 * This script executes various SQL queries to review the comparisons_cache table
 * using the Supabase client.
 * 
 * Usage:
 *   tsx backend/scripts/query-comparisons-cache.ts [query-number]
 * 
 * Examples:
 *   tsx backend/scripts/query-comparisons-cache.ts 1    # Ver todas las entradas
 *   tsx backend/scripts/query-comparisons-cache.ts 2    # Contar entradas
 *   tsx backend/scripts/query-comparisons-cache.ts stats # Ver estadísticas
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('QueryComparisonsCache');
const supabase = createSupabaseClient();

/**
 * Query 1: Ver todas las entradas del cache
 */
async function queryAllEntries() {
    logger.info('📋 Query 1: Ver todas las entradas del cache\n');
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('id, topic, party_ids, expires_at, created_at, updated_at, metadata')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    logger.info(`✅ Total: ${data?.length || 0} entradas\n`);
    
    data?.forEach((entry, idx) => {
        logger.info(`${idx + 1}. ${entry.topic}`);
        logger.info(`   Partidos: ${entry.party_ids?.join(', ') || 'N/A'}`);
        logger.info(`   Creado: ${new Date(entry.created_at).toLocaleString()}`);
        logger.info(`   Expira: ${entry.expires_at ? new Date(entry.expires_at).toLocaleString() : 'Nunca'}`);
        logger.info('');
    });
}

/**
 * Query 2: Contar total de entradas
 */
async function queryCount() {
    logger.info('📊 Query 2: Contar total de entradas\n');
    
    const { count, error } = await supabase
        .from('comparisons_cache')
        .select('*', { count: 'exact', head: true });

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    logger.info(`✅ Total de entradas: ${count || 0}\n`);
}

/**
 * Query 3: Ver entradas agrupadas por tema
 */
async function queryByTopic() {
    logger.info('📚 Query 3: Entradas agrupadas por tema\n');
    
    // Supabase no soporta GROUP BY directamente, así que hacemos la query manualmente
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('topic, created_at, updated_at');

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    // Agrupar manualmente
    const grouped = new Map<string, { count: number; first: Date; last: Date }>();
    
    data?.forEach(entry => {
        const existing = grouped.get(entry.topic) || { count: 0, first: new Date(entry.created_at), last: new Date(entry.updated_at) };
        existing.count++;
        if (new Date(entry.created_at) < existing.first) existing.first = new Date(entry.created_at);
        if (new Date(entry.updated_at) > existing.last) existing.last = new Date(entry.updated_at);
        grouped.set(entry.topic, existing);
    });

    const sorted = Array.from(grouped.entries())
        .sort((a, b) => b[1].count - a[1].count);

    logger.info(`✅ Total de temas únicos: ${sorted.length}\n`);
    
    sorted.forEach(([topic, stats], idx) => {
        logger.info(`${idx + 1}. ${topic}`);
        logger.info(`   Veces cacheadas: ${stats.count}`);
        logger.info(`   Primera vez: ${stats.first.toLocaleString()}`);
        logger.info(`   Última actualización: ${stats.last.toLocaleString()}`);
        logger.info('');
    });
}

/**
 * Query 4: Ver entradas agrupadas por combinación de partidos
 */
async function queryByParties() {
    logger.info('👥 Query 4: Entradas agrupadas por combinación de partidos\n');
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('party_ids');

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    // Agrupar manualmente
    const grouped = new Map<string, number>();
    
    data?.forEach(entry => {
        const key = entry.party_ids?.sort().join(',') || 'unknown';
        grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    const sorted = Array.from(grouped.entries())
        .sort((a, b) => b[1] - a[1]);

    logger.info(`✅ Total de combinaciones únicas: ${sorted.length}\n`);
    
    sorted.forEach(([parties, count], idx) => {
        const numParties = parties.split(',').length;
        logger.info(`${idx + 1}. [${numParties} partidos] ${parties}`);
        logger.info(`   Veces: ${count}`);
        logger.info('');
    });
}

/**
 * Query 5: Ver entradas expiradas
 */
async function queryExpired() {
    logger.info('⏰ Query 5: Entradas expiradas\n');
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('id, topic, party_ids, expires_at, created_at')
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString());

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    logger.info(`✅ Entradas expiradas: ${data?.length || 0}\n`);
    
    if (data && data.length > 0) {
        data.forEach((entry, idx) => {
            logger.info(`${idx + 1}. ${entry.topic}`);
            logger.info(`   Partidos: ${entry.party_ids?.join(', ') || 'N/A'}`);
            logger.info(`   Expiró: ${new Date(entry.expires_at).toLocaleString()}`);
            logger.info('');
        });
    } else {
        logger.info('✅ No hay entradas expiradas\n');
    }
}

/**
 * Query 6: Ver entradas que nunca expiran
 */
async function queryNeverExpires() {
    logger.info('♾️  Query 6: Entradas que nunca expiran\n');
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('id, topic, party_ids, created_at, updated_at')
        .is('expires_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    logger.info(`✅ Entradas que nunca expiran: ${data?.length || 0}\n`);
    
    data?.forEach((entry, idx) => {
        logger.info(`${idx + 1}. ${entry.topic}`);
        logger.info(`   Partidos: ${entry.party_ids?.join(', ') || 'N/A'}`);
        logger.info(`   Creado: ${new Date(entry.created_at).toLocaleString()}`);
        logger.info('');
    });
}

/**
 * Query 7: Ver temas más consultados
 */
async function queryTopTopics() {
    logger.info('🏆 Query 7: Top 10 temas más consultados\n');
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('topic, updated_at');

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    // Agrupar y contar
    const grouped = new Map<string, { count: number; lastUpdate: Date }>();
    
    data?.forEach(entry => {
        const existing = grouped.get(entry.topic) || { count: 0, lastUpdate: new Date(entry.updated_at) };
        existing.count++;
        if (new Date(entry.updated_at) > existing.lastUpdate) {
            existing.lastUpdate = new Date(entry.updated_at);
        }
        grouped.set(entry.topic, existing);
    });

    const sorted = Array.from(grouped.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);

    sorted.forEach(([topic, stats], idx) => {
        logger.info(`${idx + 1}. ${topic}`);
        logger.info(`   Veces cacheadas: ${stats.count}`);
        logger.info(`   Última actualización: ${stats.lastUpdate.toLocaleString()}`);
        logger.info('');
    });
}

/**
 * Query Stats: Ver estadísticas completas
 */
async function queryStats() {
    logger.info('📈 Estadísticas completas del cache\n');
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('topic, party_ids, expires_at, created_at, updated_at');

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    const stats = {
        total: data?.length || 0,
        uniqueTopics: new Set(data?.map(d => d.topic) || []).size,
        uniquePartyCombos: new Set(data?.map(d => d.party_ids?.sort().join(',') || '') || []).size,
        neverExpire: data?.filter(d => !d.expires_at).length || 0,
        expired: data?.filter(d => d.expires_at && new Date(d.expires_at) < new Date()).length || 0,
        active: data?.filter(d => d.expires_at && new Date(d.expires_at) >= new Date()).length || 0,
        oldest: data && data.length > 0 ? new Date(Math.min(...data.map(d => new Date(d.created_at).getTime()))) : null,
        newest: data && data.length > 0 ? new Date(Math.max(...data.map(d => new Date(d.created_at).getTime()))) : null,
    };

    logger.info(`Total de entradas: ${stats.total}`);
    logger.info(`Temas únicos: ${stats.uniqueTopics}`);
    logger.info(`Combinaciones de partidos únicas: ${stats.uniquePartyCombos}`);
    logger.info(`Nunca expiran: ${stats.neverExpire}`);
    logger.info(`Expiradas: ${stats.expired}`);
    logger.info(`Activas: ${stats.active}`);
    if (stats.oldest) logger.info(`Entrada más antigua: ${stats.oldest.toLocaleString()}`);
    if (stats.newest) logger.info(`Entrada más reciente: ${stats.newest.toLocaleString()}`);
    logger.info('');
}

/**
 * Query 12: Ver entradas de un partido específico
 */
async function queryByParty(partySlug: string) {
    logger.info(`🔍 Query 12: Entradas que incluyen el partido "${partySlug}"\n`);
    
    const { data, error } = await supabase
        .from('comparisons_cache')
        .select('id, topic, party_ids, created_at')
        .contains('party_ids', [partySlug])
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('❌ Error:', error);
        return;
    }

    logger.info(`✅ Entradas encontradas: ${data?.length || 0}\n`);
    
    data?.forEach((entry, idx) => {
        logger.info(`${idx + 1}. ${entry.topic}`);
        logger.info(`   Partidos: ${entry.party_ids?.join(', ') || 'N/A'}`);
        logger.info(`   Creado: ${new Date(entry.created_at).toLocaleString()}`);
        logger.info('');
    });
}

/**
 * Main function
 */
async function main() {
    const queryArg = process.argv[2];

    if (!queryArg) {
        logger.info('📋 Queries disponibles:\n');
        logger.info('  1  - Ver todas las entradas');
        logger.info('  2  - Contar total de entradas');
        logger.info('  3  - Entradas agrupadas por tema');
        logger.info('  4  - Entradas agrupadas por combinación de partidos');
        logger.info('  5  - Ver entradas expiradas');
        logger.info('  6  - Ver entradas que nunca expiran');
        logger.info('  7  - Top 10 temas más consultados');
        logger.info('  stats - Estadísticas completas');
        logger.info('  party:<slug> - Entradas de un partido (ej: party:pln)\n');
        logger.info('Ejemplos:');
        logger.info('  tsx backend/scripts/query-comparisons-cache.ts 1');
        logger.info('  tsx backend/scripts/query-comparisons-cache.ts stats');
        logger.info('  tsx backend/scripts/query-comparisons-cache.ts party:pln\n');
        return;
    }

    try {
        if (queryArg === '1') {
            await queryAllEntries();
        } else if (queryArg === '2') {
            await queryCount();
        } else if (queryArg === '3') {
            await queryByTopic();
        } else if (queryArg === '4') {
            await queryByParties();
        } else if (queryArg === '5') {
            await queryExpired();
        } else if (queryArg === '6') {
            await queryNeverExpires();
        } else if (queryArg === '7') {
            await queryTopTopics();
        } else if (queryArg === 'stats') {
            await queryStats();
        } else if (queryArg.startsWith('party:')) {
            const partySlug = queryArg.split(':')[1];
            await queryByParty(partySlug);
        } else {
            logger.error(`❌ Query desconocido: ${queryArg}`);
            logger.info('Ejecuta sin argumentos para ver las opciones disponibles');
        }
    } catch (error) {
        logger.error('❌ Error ejecutando query:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

