/**
 * TOON Statistics Tracker
 * 
 * Tracks cumulative token savings from using TOON format
 */

interface TOONStats {
    totalQueries: number;
    totalToonTokens: number;
    totalJsonTokens: number;
    totalSavedTokens: number;
    queries: Array<{
        query: string;
        toonTokens: number;
        jsonTokens: number;
        savedTokens: number;
        timestamp: Date;
    }>;
}

class TOONStatsTracker {
    private stats: TOONStats = {
        totalQueries: 0,
        totalToonTokens: 0,
        totalJsonTokens: 0,
        totalSavedTokens: 0,
        queries: [],
    };

    /**
     * Record a query's token usage
     */
    recordQuery(
        query: string,
        toonTokens: number,
        jsonTokens: number
    ): void {
        const savedTokens = jsonTokens - toonTokens;

        this.stats.totalQueries++;
        this.stats.totalToonTokens += toonTokens;
        this.stats.totalJsonTokens += jsonTokens;
        this.stats.totalSavedTokens += savedTokens;

        this.stats.queries.push({
            query,
            toonTokens,
            jsonTokens,
            savedTokens,
            timestamp: new Date(),
        });

        // Keep only last 1000 queries in memory
        if (this.stats.queries.length > 1000) {
            this.stats.queries.shift();
        }
    }

    /**
     * Get current statistics
     */
    getStats(): TOONStats {
        return { ...this.stats };
    }

    /**
     * Get summary statistics
     */
    getSummary(): {
        totalQueries: number;
        totalToonTokens: number;
        totalJsonTokens: number;
        totalSavedTokens: number;
        avgSavingsPercent: number;
        estimatedCostSavings: number; // Assuming $0.0001 per 1K tokens
    } {
        const avgSavingsPercent =
            this.stats.totalJsonTokens > 0
                ? (this.stats.totalSavedTokens / this.stats.totalJsonTokens) * 100
                : 0;

        const estimatedCostSavings = (this.stats.totalSavedTokens / 1000) * 0.0001;

        return {
            totalQueries: this.stats.totalQueries,
            totalToonTokens: this.stats.totalToonTokens,
            totalJsonTokens: this.stats.totalJsonTokens,
            totalSavedTokens: this.stats.totalSavedTokens,
            avgSavingsPercent,
            estimatedCostSavings,
        };
    }

    /**
     * Reset statistics
     */
    reset(): void {
        this.stats = {
            totalQueries: 0,
            totalToonTokens: 0,
            totalJsonTokens: 0,
            totalSavedTokens: 0,
            queries: [],
        };
    }
}

// Singleton instance
export const toonStatsTracker = new TOONStatsTracker();

