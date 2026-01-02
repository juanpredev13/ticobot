import { Logger } from '@ticobot/shared';

export interface TextCleaningOptions {
    normalizeWhitespace?: boolean;
    removeSpecialChars?: boolean;
    fixEncoding?: boolean;
    preservePunctuation?: boolean;
    extractPageMarkers?: boolean;
}

export interface PageMarker {
    pageNumber: number;
    totalPages: number;
    position: number;
}

export interface CleaningResult {
    cleanedText: string;
    pageMarkers: PageMarker[];
}

export class TextCleaner {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('TextCleaner');
    }

    /**
     * Clean and normalize text content with page marker extraction
     * @param text - Raw text to clean
     * @param options - Cleaning options
     * @returns Cleaned text and extracted page markers
     */
    cleanWithMetadata(text: string, options: TextCleaningOptions = {}): CleaningResult {
        const {
            normalizeWhitespace = true,
            removeSpecialChars = true,
            fixEncoding = true,
            preservePunctuation = true,
            extractPageMarkers = true
        } = options;

        this.logger.info(`Cleaning text (${text.length} characters)`);

        let cleaned = text;
        let pageMarkers: PageMarker[] = [];

        // 1. Extract page markers BEFORE cleaning
        if (extractPageMarkers) {
            const result = this.extractPageMarkers(cleaned);
            cleaned = result.text;
            pageMarkers = result.markers;
        }

        // 2. Fix encoding issues (common in Spanish PDFs)
        if (fixEncoding) {
            cleaned = this.fixEncodingIssues(cleaned);
        }

        // 3. Remove color codes (hexadecimal codes like #FFD700, #CC0000)
        cleaned = this.removeColorCodes(cleaned);

        // 4. Fix common OCR errors BEFORE normalizing whitespace
        cleaned = this.fixOCRErrors(cleaned);

        // 5. Remove or normalize special characters
        if (removeSpecialChars) {
            cleaned = this.removeSpecialCharacters(cleaned, preservePunctuation);
        }

        // 6. Normalize whitespace
        if (normalizeWhitespace) {
            cleaned = this.normalizeWhitespace(cleaned);
        }

        // 5. Trim
        cleaned = cleaned.trim();

        this.logger.info(`Text cleaned (${cleaned.length} characters, ${text.length - cleaned.length} removed, ${pageMarkers.length} page markers extracted)`);

        return {
            cleanedText: cleaned,
            pageMarkers
        };
    }

    /**
     * Clean text (backwards compatibility)
     * @param text - Raw text to clean
     * @param options - Cleaning options
     * @returns Cleaned text
     */
    clean(text: string, options: TextCleaningOptions = {}): string {
        const result = this.cleanWithMetadata(text, options);
        return result.cleanedText;
    }

    /**
     * Extract page markers from PDF text
     * Markers follow pattern: -- N of M --
     * @returns Text with markers removed and array of marker positions
     */
    private extractPageMarkers(text: string): { text: string; markers: PageMarker[] } {
        const markers: PageMarker[] = [];
        const pageMarkerRegex = /--\s*(\d+)\s+of\s+(\d+)\s*--/gi;

        let match;
        let position = 0;

        while ((match = pageMarkerRegex.exec(text)) !== null) {
            const pageNumber = parseInt(match[1], 10);
            const totalPages = parseInt(match[2], 10);

            markers.push({
                pageNumber,
                totalPages,
                position: match.index - (position * match[0].length) // Adjust for removed markers
            });

            position++;
        }

        // Remove all page markers from text
        const cleanedText = text.replace(pageMarkerRegex, '');

        return { text: cleanedText, markers };
    }

    /**
     * Fix common encoding issues in Spanish text
     */
    private fixEncodingIssues(text: string): string {
        const encodingMap: Record<string, string> = {
            // Spanish vowels with accents (lowercase)
            'Ã¡': 'á',
            'Ã©': 'é',
            'Ã­': 'í',
            'Ã³': 'ó',
            'Ãº': 'ú',
            // Spanish vowels with accents (uppercase)
            'Ã\x81': 'Á',
            'Ã\x89': 'É',
            'Ã\x8D': 'Í',
            'Ã\x93': 'Ó',
            'Ã\x9A': 'Ú',
            // Spanish ñ
            'Ã±': 'ñ',
            'Ã\x91': 'Ñ',
            // Common quotation marks
            'â\x80\x9C': '"',
            'â\x80\x9D': '"',
            'â\x80\x99': "'",
            'â\x80\x98': "'",
            // Dashes
            'â\x80\x93': '-',  // en dash
            'â\x80\x94': '—',  // em dash
        };

        let fixed = text;

        // Remove Unicode artifacts and control characters (common in PDFs)
        // Remove characters that are not printable ASCII or common Spanish characters
        fixed = fixed.replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, '');
        
        // Remove specific problematic Unicode ranges (like Cyrillic, special symbols)
        // Keep: Latin (A-Z, a-z), Spanish accented (áéíóúñÁÉÍÓÚÑ), numbers, basic punctuation
        fixed = fixed.replace(/[^\x20-\x7EáéíóúñÁÉÍÓÚÑ¿¡]/g, (char) => {
            const code = char.charCodeAt(0);
            // Allow common Spanish characters and basic punctuation
            if (code >= 0x00A0 && code <= 0x024F) {
                // Latin Extended-A and B (includes Spanish)
                return char;
            }
            // Remove everything else that's not basic ASCII
            return '';
        });

        // Fix character map issues
        for (const [wrong, correct] of Object.entries(encodingMap)) {
            fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
        }

        // Fix common PDF parsing artifacts
        // Pattern: colon replacing "ti" before any lowercase letter
        // Examples: perspec:vas → perspectivas, polí:co → político, par:cipan → participan
        fixed = fixed.replace(/:([a-záéíóúñü])/g, 'ti$1');
        
        // Fix colon at start of words (common OCR error)
        // Examples: :ene → tiene, :po → tipo, :co → tico
        fixed = fixed.replace(/\b:([a-záéíóúñü]{1,2})/g, (match, letters) => {
            // Common patterns
            if (letters === 'ene') return 'tiene';
            if (letters === 'po') return 'tipo';
            if (letters === 'co') return 'tico';
            if (letters === 'vo') return 'tivo';
            if (letters === 'va') return 'tiva';
            if (letters === 'vos') return 'tivos';
            if (letters === 'vas') return 'tivas';
            // Default: assume it's "ti" + letters
            return 'ti' + letters;
        });

        // Fix software-like patterns (soRware -> software, :po -> tipo)
        fixed = fixed.replace(/so([A-Z])ware/g, 'software');

        // Fix uppercase letters that should be lowercase in middle of words
        fixed = fixed.replace(/([a-z])([A-Z])([a-z])/g, (match, before, upper, after) => {
            // Common patterns: soRware, :po, etc.
            const lowerMap: Record<string, string> = {
                'R': 'ft',
                'Y': 'ft',
                'n': 'ñ'
            };
            return before + (lowerMap[upper] || upper.toLowerCase()) + after;
        });

        return fixed;
    }

    /**
     * Fix common OCR errors in Spanish text
     * This should be called before normalizing whitespace
     */
    private fixOCRErrors(text: string): string {
        let fixed = text;
        
        // Fix missing spaces before common words (words that should have space before them)
        const wordsNeedingSpaceBefore = [
            'centro', 'familia', 'familias', 'persona', 'personas', 'confianza', 'problema', 'problemas',
            'construiremos', 'construir', 'pueblo', 'país', 'paí', 'vocación', 'decisiones', 'calidad',
            'rápido', 'rápidamente', 'además', 'ademá', 'sienten', 'escuchados', 'escuchado',
            'descentralización', 'descentralizació', 'educación', 'educació', 'salud', 'alud',
            'merecen', 'erecen', 'sabe', 'sabemos', 'saben', 'reducir', 'reduciendo', 'educir',
            'motor', 'motores', 'ciencias', 'dispositivos', 'insumos', 'servicios', 'médicos',
            'microbiología', 'farmacia', 'software', 'clínico', 'potencial', 'escalar', 'cadena',
            'valor', 'nivel', 'mundial', 'turístico', 'segurando', 'encadenamientos', 'locales',
            'complementariedad', 'economía', 'azul', 'verde', 'estrategia', 'desarrollo', 'nacional',
            'vertientes', 'multipolar', 'énfasis', 'enfatizando', 'ciudades', 'emergentes', 'periféricas',
            'Liberia', 'Ciudad', 'Quesada', 'Guápiles', 'San', 'Isidro', 'General', 'infraestructura',
            'logística', 'tecnología', 'costos', 'producción', 'producció', 'destrabar', 'política',
            'políticas', 'clústeres', 'aglomeraciones', 'productivas', 'coordinan', 'públicas',
            'conjunto', 'empresas', 'grandes', 'pequeñas', 'encadenamientos', 'agregado', 'costarricense',
            'líder', 'capacidad', 'convivir', 'paz', 'ambiente', 'tecnología', 'abolición', 'ejército',
            'construimos', 'cultura', 'interna', 'resuelve', 'conflictos', 'hablando', 'armas', 'ultura',
            'recuperar', 'distinguimos', 'parques', 'nacionales', 'reforestado', 'siguiente', 'paso',
            'ecología', 'integral', 'adaptación', 'climática', 'finalmente', 'debemos', 'dominar',
            'inteligencia', 'artificial', 'redes', 'sociales', 'teléfonos', 'liderazgos', 'definen',
            'diferencian', 'exterior', 'deberá', 'orientada', 'promover', 'síntesis', 'haremos',
            'democracia', 'resuelva', 'costarricenses', 'recupere'
        ];
        
        // Add space before these words when they appear without space
        for (const word of wordsNeedingSpaceBefore) {
            // Pattern: letter(s) + word (missing space)
            fixed = fixed.replace(new RegExp(`([a-záéíóúñA-ZÁÉÍÓÚÑ])(${word}\\b)`, 'gi'), '$1 $2');
        }
        
        // Fix common OCR errors: missing letters in common words
        // "on " → "con " (when followed by lowercase word)
        fixed = fixed.replace(/\bon\s+([a-záéíóúñ]{2,})/g, 'con $1');
        // "ara " → "para " (when followed by lowercase word)
        fixed = fixed.replace(/\bara\s+([a-záéíóúñ]{1,4})/g, 'para $1');
        // "ue " → "que " (when followed by lowercase word)
        fixed = fixed.replace(/\bue\s+([a-záéíóúñ]{2,})/g, 'que $1');
        // "ino " → "sino " (when followed by lowercase word)
        fixed = fixed.replace(/\bino\s+([a-záéíóúñ]{2,})/g, 'sino $1');
        // "ú " → "aún " (when followed by lowercase word)
        fixed = fixed.replace(/\bú\s+([a-záéíóúñ]{2,})/g, 'aún $1');
        // "onde" → "donde" (standalone word)
        fixed = fixed.replace(/\bonde\s+/g, 'donde ');
        // "visió" → "visión" (missing 'n')
        fixed = fixed.replace(/\bvisió\s+/g, 'visión ');
        // "má" → "más" (when standalone or before word)
        fixed = fixed.replace(/\bmá\s+/g, 'más ');
        // "as " → "las " (when followed by common nouns)
        fixed = fixed.replace(/\bas\s+(familia|familias|persona|personas|cosas|iniciativas|zonas)/g, 'las $1');
        // "omos" → "somos" (when standalone)
        fixed = fixed.replace(/\bomos\s+/g, 'somos ');
        // "onstruiremos" → "construiremos"
        fixed = fixed.replace(/\bonstruiremos/g, 'construiremos');
        // "educir" → "reducir"
        fixed = fixed.replace(/\beducir/g, 'reducir');
        fixed = fixed.replace(/\beduciendo/g, 'reduciendo');
        // "favorde" → "favor de"
        fixed = fixed.replace(/\bfavorde/g, 'favor de');
        // "uerequiere" → "que requiere"
        fixed = fixed.replace(/\buerequiere/g, 'que requiere');
        // "laconfianza" → "la confianza"
        fixed = fixed.replace(/\blaconfianza/g, 'la confianza');
        // "losproblemas" → "los problemas"
        fixed = fixed.replace(/\blosproblemas/g, 'los problemas');
        // "se sientenescuchados" → "se sienten escuchados"
        fixed = fixed.replace(/\bsentense/g, 'se sienten ');
        fixed = fixed.replace(/\bsientenescuchados/g, 'sienten escuchados');
        // "dedecisiones" → "de decisiones"
        fixed = fixed.replace(/\bdedecisiones/g, 'de decisiones');
        // "másrápido" → "más rápido"
        fixed = fixed.replace(/\bmásrápido/g, 'más rápido');
        // "Ademá" → "Además"
        fixed = fixed.replace(/\bAdemá\s+/g, 'Además ');
        // "decisionescon" → "decisiones con"
        fixed = fixed.replace(/\bdecisionescon/g, 'decisiones con');
        // "decalidad" → "de calidad"
        fixed = fixed.replace(/\bdecalidad/g, 'de calidad');
        // "seguridad alud" → "seguridad salud"
        fixed = fixed.replace(/\balud\s+y/g, 'salud y');
        // "educació" → "educación" (when at end of word or before space)
        fixed = fixed.replace(/\beducació\s+/g, 'educación ');
        // "erecen" → "merecen"
        fixed = fixed.replace(/\berecen/g, 'merecen');
        // "unpueblo" → "un pueblo"
        fixed = fixed.replace(/\bunpueblo/g, 'un pueblo');
        // "tienevocació" → "tiene vocación"
        fixed = fixed.replace(/\btienevocació/g, 'tiene vocación');
        // "este paí" → "este país"
        fixed = fixed.replace(/\bpaí\s+/g, 'país ');
        // "descentralizació" → "descentralización"
        fixed = fixed.replace(/\bdescentralizació\s+/g, 'descentralización ');
        // "producció" → "producción"
        fixed = fixed.replace(/\bproducció\s+/g, 'producción ');
        // "ultura" → "cultura" (when after "una")
        fixed = fixed.replace(/\buna\s+ultura/g, 'una cultura');
        // "lmotor" → "el motor"
        fixed = fixed.replace(/\blmotor/g, 'el motor');
        // "nsumos" → "insumos"
        fixed = fixed.replace(/\bnsumos/g, 'insumos');
        // "armacia" → "farmacia"
        fixed = fixed.replace(/\barmacia/g, 'farmacia');
        // "segurando" → "asegurando"
        fixed = fixed.replace(/\bsegurando/g, 'asegurando');
        // "nfatizando" → "enfatizando"
        fixed = fixed.replace(/\bnfatizando/g, 'enfatizando');
        // "iudad" → "Ciudad"
        fixed = fixed.replace(/\biudad\s+Quesada/g, 'Ciudad Quesada');
        // "uápiles" → "Guápiles"
        fixed = fixed.replace(/\buápiles/g, 'Guápiles');
        // "on" → "con" (when before infrastructure, technology, etc.)
        fixed = fixed.replace(/\bon\s+(infraestructura|tecnología|tecnológica|mayor|sustento)/g, 'con $1');
        // Fix missing space after period before capital letter
        fixed = fixed.replace(/\.([A-ZÁÉÍÓÚÑ])/g, '. $1');
        
        return fixed;
    }

    /**
     * Remove hexadecimal color codes (e.g., #FFD700, #CC0000)
     * Also removes comma-separated color lists
     */
    private removeColorCodes(text: string): string {
        // Remove hex color codes (3 or 6 digits after #)
        // Pattern: # followed by 3-6 hexadecimal characters
        let cleaned = text.replace(/#[0-9A-Fa-f]{3,6}/g, '');
        
        // Clean up leftover commas and spaces that were part of color lists
        // Remove patterns like ", " or ", " that might be left after removing colors
        cleaned = cleaned.replace(/,\s*,/g, ','); // Multiple commas
        cleaned = cleaned.replace(/^\s*,\s*/g, ''); // Leading comma
        cleaned = cleaned.replace(/\s*,\s*$/g, ''); // Trailing comma
        cleaned = cleaned.replace(/\s{2,}/g, ' '); // Multiple spaces
        
        return cleaned;
    }

    /**
     * Remove special characters while preserving Spanish letters
     */
    private removeSpecialCharacters(text: string, preservePunctuation: boolean): string {
        let cleaned = text;
        
        // Remove lines that are only single characters, commas, or mostly punctuation
        const lines = cleaned.split('\n');
        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return false;
            
            // Count meaningful content
            const letterCount = (trimmed.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g) || []).length;
            const singleCharWords = (trimmed.match(/\b[a-zA-Z]\b/g) || []).length;
            const commaCount = (trimmed.match(/,/g) || []).length;
            const totalChars = trimmed.length;
            
            // Skip lines that are too short and mostly punctuation
            if (totalChars < 3) return false;
            
            // Skip lines that are mostly single characters
            if (singleCharWords > totalChars * 0.6) return false;
            
            // Skip lines that are mostly commas
            if (commaCount > totalChars * 0.4) return false;
            
            // Skip lines with very few letters
            if (letterCount < totalChars * 0.2) return false;
            
            return true;
        });
        cleaned = filteredLines.join('\n');
        
        // Remove common PDF artifacts: single characters surrounded by spaces/punctuation
        // Pattern: " , ", " j ", " B ", " a ", " M " (but keep if it's a valid word)
        cleaned = cleaned.replace(/\s+([a-zA-Z])\s+(?=[A-Z])/g, ' '); // Single char before capital
        cleaned = cleaned.replace(/,\s*([a-zA-Z])\s*,/g, ','); // Single char between commas
        cleaned = cleaned.replace(/\s+([a-zA-Z])\s+$/gm, ''); // Single char at end of line
        cleaned = cleaned.replace(/^\s*([a-zA-Z])\s+/gm, ''); // Single char at start of line
        
        // Remove excessive commas (more than 2 consecutive)
        cleaned = cleaned.replace(/,{3,}/g, ',');
        
        // Remove patterns like ", ," or ", , ,"
        cleaned = cleaned.replace(/,\s*,+/g, ',');
        
        // Remove standalone single characters that are not part of words
        cleaned = cleaned.replace(/\b([a-zA-Z])\b(?=\s|$|,|\.)/g, (match, char) => {
            // Keep if it's a common single-letter word (like "a" in Spanish)
            const commonSingleChars = ['a', 'y', 'o', 'e', 'u'];
            return commonSingleChars.includes(char.toLowerCase()) ? match : '';
        });
        
        if (preservePunctuation) {
            // Keep letters, numbers, spaces, and common punctuation
            // Include Spanish letters: áéíóúñÁÉÍÓÚÑ
            cleaned = cleaned.replace(/[^\w\s\-.,;:!?¿¡áéíóúñÁÉÍÓÚÑ]/g, '');
        } else {
            // Keep only letters, numbers, and spaces
            cleaned = cleaned.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '');
        }
        
        return cleaned;
    }

    /**
     * Normalize whitespace (multiple spaces, tabs, newlines)
     */
    private normalizeWhitespace(text: string): string {
        let cleaned = text;
        
        // First, fix missing spaces between words
        // Pattern: lowercase letter followed by uppercase (missing space)
        cleaned = cleaned.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
        // Pattern: uppercase word followed by lowercase (like "PRESENTACIÓNCosta" → "PRESENTACIÓN Costa")
        cleaned = cleaned.replace(/([A-ZÁÉÍÓÚÑ]{3,})([a-záéíóúñ])/g, '$1 $2');
        // Pattern: number followed by letter or vice versa (usually needs space)
        cleaned = cleaned.replace(/([0-9])([A-Za-záéíóúñÁÉÍÓÚÑ])/g, '$1 $2');
        cleaned = cleaned.replace(/([A-Za-záéíóúñÁÉÍÓÚÑ])([0-9])/g, '$1 $2');
        
        // Remove lines that are only punctuation or single characters
        cleaned = cleaned.split('\n')
            .map(line => line.trim())
            .filter(line => {
                // Filter out lines that are mostly punctuation or single chars
                if (line.length === 0) return false;
                const letterCount = (line.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g) || []).length;
                const totalChars = line.length;
                return letterCount > totalChars * 0.3; // At least 30% letters
            })
            .join('\n');
        
        // Remove standalone single characters that aren't common words
        cleaned = cleaned.replace(/\b([a-zA-Z])\b(?=\s|$|,|\.|;|:)/g, (match, char) => {
            // Keep common single-letter words
            const commonSingleChars = ['a', 'y', 'o', 'e', 'u', 'i'];
            return commonSingleChars.includes(char.toLowerCase()) ? match : '';
        });
        
        // Replace multiple spaces with single space
        cleaned = cleaned.replace(/[ \t]+/g, ' ');
        
        // Replace multiple newlines with double newline (preserve paragraphs)
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        
        // Remove spaces around single newlines, but preserve double newlines
        cleaned = cleaned.replace(/ *\n *\n */g, '\n\n');  // Preserve paragraph breaks
        cleaned = cleaned.replace(/ *\n */g, '\n');        // Clean single newlines
        
        // Remove excessive commas at line boundaries
        cleaned = cleaned.replace(/^,+\s*/gm, '');
        cleaned = cleaned.replace(/\s*,+$/gm, '');
        
        // Fix patterns like "cuatroaLa" -> "cuatro a La" (lowercase followed by uppercase)
        cleaned = cleaned.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g, '$1 $2');
        
        // Fix missing spaces after words ending in uppercase (like "PRESENTACIÓNCosta" → "PRESENTACIÓN Costa")
        // But be careful: only if the next word is at least 3 characters and starts with capital
        cleaned = cleaned.replace(/([A-ZÁÉÍÓÚÑ]{3,})([A-Z][a-záéíóúñ]{2,})/g, '$1 $2');
        
        // Fix space issues: remove space between uppercase letter and lowercase (like "PRESENTACIÓNC osta" → "PRESENTACIÓNCosta")
        cleaned = cleaned.replace(/([A-ZÁÉÍÓÚÑ])\s+([a-záéíóúñ])/g, '$1$2');
        // Then fix the actual missing space (like "PRESENTACIÓNCosta" → "PRESENTACIÓN Costa")
        cleaned = cleaned.replace(/([A-ZÁÉÍÓÚÑ]{3,})([A-Z][a-záéíóúñ]{2,})/g, '$1 $2');
        
        // Fix missing spaces between lowercase words - be more aggressive
        // Common patterns: word + word (missing space)
        const commonWordPairs = [
            ['el', 'centro'], ['las', 'familias'], ['las', 'personas'], ['la', 'confianza'],
            ['los', 'problemas'], ['se', 'sienten'], ['de', 'decisiones'], ['más', 'rápido'],
            ['decisiones', 'con'], ['de', 'calidad'], ['un', 'pueblo'], ['tiene', 'vocación'],
            ['este', 'país'], ['favor', 'de'], ['que', 'requiere'], ['una', 'cultura'],
            ['el', 'motor'], ['producción'], ['descentralización'], ['educación'],
            ['perspectivas', 'diferentes'], ['tiene', 'goteras'], ['casa', 'sino'],
            ['población', 'frustrada'], ['por', 'mejorar'], ['repararlas', '.']
        ];
        
        // Fix specific known patterns from PLN document
        cleaned = cleaned.replace(/(el)(centro)/g, '$1 $2');
        cleaned = cleaned.replace(/(las)(familias)/g, '$1 $2');
        cleaned = cleaned.replace(/(las)(personas)/g, '$1 $2');
        cleaned = cleaned.replace(/(la)(confianza)/g, '$1 $2');
        cleaned = cleaned.replace(/(los)(problemas)/g, '$1 $2');
        cleaned = cleaned.replace(/(se)(sienten)/g, '$1 $2');
        cleaned = cleaned.replace(/(de)(decisiones)/g, '$1 $2');
        cleaned = cleaned.replace(/(más)(rápido)/g, '$1 $2');
        cleaned = cleaned.replace(/(decisiones)(con)/g, '$1 $2');
        cleaned = cleaned.replace(/(de)(calidad)/g, '$1 $2');
        cleaned = cleaned.replace(/(un)(pueblo)/g, '$1 $2');
        cleaned = cleaned.replace(/(tiene)(vocación)/g, '$1 $2');
        cleaned = cleaned.replace(/(este)(país)/g, '$1 $2');
        cleaned = cleaned.replace(/(favor)(de)/g, '$1 $2');
        cleaned = cleaned.replace(/(que)(requiere)/g, '$1 $2');
        cleaned = cleaned.replace(/(una)(cultura)/g, '$1 $2');
        cleaned = cleaned.replace(/(el)(motor)/g, '$1 $2');
        cleaned = cleaned.replace(/(perspectivas)(diferentes)/g, '$1 $2');
        cleaned = cleaned.replace(/(tiene)(goteras)/g, '$1 $2');
        cleaned = cleaned.replace(/(casa)(sino)/g, '$1 $2');
        cleaned = cleaned.replace(/(población)(frustrada)/g, '$1 $2');
        cleaned = cleaned.replace(/(por)(mejorar)/g, '$1 $2');
        cleaned = cleaned.replace(/(repararlas)\.([A-Z])/g, '$1. $2');
        
        // Fix missing space after common words - but only for specific known patterns
        // Don't break valid words like "democracia", "desencantado", etc.
        // Only fix when we're confident there's a missing space
        cleaned = cleaned.replace(/(\bel)(centro|motor|país|siguiente|sistema)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bla)(confianza|salud|educación|calidad|democracia)/g, '$1 $2');
        cleaned = cleaned.replace(/(\blos)(problemas|riesgos|costos|órganos)/g, '$1 $2');
        cleaned = cleaned.replace(/(\blas)(familias|personas|zonas|iniciativas)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bde)(decisiones|calidad|desarrollo|producción)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bun)(pueblo|país|estado|sistema)/g, '$1 $2');
        cleaned = cleaned.replace(/(\buna)(cultura|población|nación)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bque)(requiere|resuelve|anhelamos|sea)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bse)(sienten|fortalece|resuelven|necesitan)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bmás)(rápido|complejos|elevados)/g, '$1 $2');
        cleaned = cleaned.replace(/(\btiene)(vocación|goteras|registro)/g, '$1 $2');
        cleaned = cleaned.replace(/(\beste)(país|paí|sistema|modelo)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bfavor)(de|para)/g, '$1 $2');
        cleaned = cleaned.replace(/(\bdecisiones)(con|tiene)/g, '$1 $2');
        
        // Fix words that were incorrectly split by previous rules
        cleaned = cleaned.replace(/\bde\s+mocracia/g, 'democracia');
        cleaned = cleaned.replace(/\bde\s+se\s+ncantado/g, 'desencantado');
        cleaned = cleaned.replace(/\bde\s+sa\s+rollo/g, 'desarrollo');
        cleaned = cleaned.replace(/\bde\s+ci\s+siones/g, 'decisiones');
        
        // Remove patterns like ",Bj" or ",a," (comma + single char + text)
        cleaned = cleaned.replace(/,\s*([a-zA-Z])\s*([A-Za-záéíóúñÁÉÍÓÚÑ])/g, ', $2');
        cleaned = cleaned.replace(/([a-zA-ZáéíóúñÁÉÍÓÚÑ])\s*,\s*([a-zA-Z])\s*,/g, '$1,');
        
        // Remove remaining single character artifacts before/after punctuation
        cleaned = cleaned.replace(/\s+([a-zA-Z])\s+(?=[,\.;:])/g, ' ');
        cleaned = cleaned.replace(/,\s*([a-zA-Z])\s*,/g, ',');
        cleaned = cleaned.replace(/,\s*([a-zA-Z])\s+([a-z])/g, ', $2'); // Comma + single char + lowercase word
        
        // Remove patterns like "y,a,as" -> "y as"
        cleaned = cleaned.replace(/([a-záéíóúñ])\s*,\s*([a-zA-Z])\s*,\s*([a-záéíóúñ]+)/g, '$1 $3');
        
        // Remove patterns like ", jfantástico" -> "fantástico" (comma + space + single char + word)
        cleaned = cleaned.replace(/,\s+([a-zA-Z])([a-záéíóúñ]+)/g, (match, singleChar, rest) => {
            // If the single char + rest forms a valid Spanish word pattern, keep it
            // Otherwise remove the comma and single char
            return ' ' + singleChar + rest;
        });
        
        // Clean up remaining artifacts: single chars surrounded by commas
        cleaned = cleaned.replace(/,\s*([a-zA-Z])\s*,/g, ',');
        
        // Remove single characters that appear before words (like ", jfantástico")
        cleaned = cleaned.replace(/,\s*([a-zA-Z])\s+([a-záéíóúñ]{3,})/g, (match, singleChar, word) => {
            // Check if singleChar + word could be a valid word
            // For now, just remove the comma and single char if word is long enough
            return ' ' + word;
        });
        
        return cleaned;
    }

    /**
     * Get cleaning statistics
     */
    getCleaningStats(originalText: string, cleanedText: string) {
        return {
            originalLength: originalText.length,
            cleanedLength: cleanedText.length,
            charactersRemoved: originalText.length - cleanedText.length,
            reductionPercentage: ((originalText.length - cleanedText.length) / originalText.length * 100).toFixed(2) + '%'
        };
    }
}
