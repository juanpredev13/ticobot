/**
 * Utility functions for party colors
 */

import type { Party } from '@/lib/api/services/parties';

/**
 * Map party name/abbreviation to party colors
 * Returns a map for quick lookup
 */
export function createPartyColorMap(parties: Party[]): Map<string, { primary: string; secondary: string }> {
  const colorMap = new Map<string, { primary: string; secondary: string }>();
  
  parties.forEach(party => {
    // Map by name
    if (party.name) {
      colorMap.set(party.name.toLowerCase(), party.colors);
    }
    
    // Map by abbreviation
    if (party.abbreviation) {
      colorMap.set(party.abbreviation.toLowerCase(), party.colors);
    }
    
    // Map by slug
    if (party.slug) {
      colorMap.set(party.slug.toLowerCase(), party.colors);
    }
  });
  
  return colorMap;
}

/**
 * Get party colors by party identifier (name, abbreviation, or slug)
 */
export function getPartyColors(
  partyIdentifier: string | undefined | null,
  colorMap: Map<string, { primary: string; secondary: string }>
): { primary: string; secondary: string } | null {
  if (!partyIdentifier) return null;
  
  const key = partyIdentifier.toLowerCase();
  return colorMap.get(key) || null;
}

/**
 * Get party primary color with fallback
 */
export function getPartyPrimaryColor(
  partyIdentifier: string | undefined | null,
  colorMap: Map<string, { primary: string; secondary: string }>
): string {
  const colors = getPartyColors(partyIdentifier, colorMap);
  return colors?.primary || '#6b7280'; // Default gray
}

/**
 * Get party secondary color with fallback
 */
export function getPartySecondaryColor(
  partyIdentifier: string | undefined | null,
  colorMap: Map<string, { primary: string; secondary: string }>
): string {
  const colors = getPartyColors(partyIdentifier, colorMap);
  return colors?.secondary || '#9ca3af'; // Default gray
}


