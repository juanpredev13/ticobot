import { describe, it, expect, beforeEach } from 'vitest';
import { TextCleaner } from '../TextCleaner';

describe('TextCleaner', () => {
    let cleaner: TextCleaner;

    beforeEach(() => {
        cleaner = new TextCleaner();
    });

    it('should fix Spanish encoding issues', () => {
        const dirty = 'EducaciÃ³n y salud para todos los costarricenses';
        const clean = cleaner.clean(dirty);

        expect(clean).toBe('Educación y salud para todos los costarricenses');
    });

    it('should normalize whitespace', () => {
        const dirty = 'Multiple    spaces\n\n\nand   newlines';
        const clean = cleaner.clean(dirty);

        expect(clean).not.toContain('    ');
        expect(clean).not.toContain('\n\n\n');
    });

    it('should preserve Spanish characters', () => {
        const text = 'ñáéíóú ÑÁÉÍÓÚ';
        const clean = cleaner.clean(text);

        expect(clean).toBe(text);
    });

    it('should remove special characters but keep punctuation', () => {
        const dirty = 'Hello! ¿Cómo estás? @#$%';
        const clean = cleaner.clean(dirty);

        expect(clean).toContain('¿');
        expect(clean).toContain('!');
        expect(clean).not.toContain('@');
        expect(clean).not.toContain('#');
    });
});
