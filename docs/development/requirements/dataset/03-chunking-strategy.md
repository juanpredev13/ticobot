# Chunking Strategy Specification

## Overview

This document defines the strategy for splitting extracted PDF text into semantic chunks optimized for RAG (Retrieval-Augmented Generation).

**Goal**: Create chunks that are semantically coherent, appropriately sized for embedding models, and provide sufficient context for accurate retrieval.

---

## Chunk Size Specifications

### Target Sizes

```
Minimum chunk size:     400 characters
Target chunk size:      800-1500 characters
Maximum chunk size:     2000 characters (hard limit)
Overlap size:           100-200 characters
```

### Rationale

**Why 800-1500 characters?**
- Embedding models work well with this size
- Contains enough context (typically 1-3 paragraphs)
- Not too large to dilute relevance
- Balances precision and recall in retrieval

**Why 100-200 character overlap?**
- Preserves context across chunk boundaries
- Helps with sentences/paragraphs split across chunks
- Improves retrieval of content near boundaries
- Minimal storage overhead

**Why 400 char minimum?**
- Avoids tiny, context-free fragments
- Ensures meaningful semantic content
- Reduces total chunk count
- Improves search quality

**Why 2000 char maximum?**
- Prevents overly broad chunks
- Maintains focus for retrieval
- Stays within embedding model limits
- Improves relevance scoring

---

## Chunking Algorithm

### Step 1: Text Preparation

```
Input: Cleaned page text
↓
1. Normalize whitespace (single spaces, consistent line breaks)
2. Identify structural elements (headings, lists, paragraphs)
3. Detect section boundaries
4. Mark metadata boundaries (headers, footers, page numbers)
```

### Step 2: Semantic Segmentation

**Priority order for splitting:**

1. **Section boundaries** - Split at major section headings
2. **Paragraph boundaries** - Prefer splitting between paragraphs
3. **Sentence boundaries** - Split at sentence end if needed
4. **Whitespace** - Last resort: split at word boundaries

### Step 3: Chunk Creation

```python
def create_chunks(text, target_size=1200, overlap=150):
    chunks = []
    start = 0

    while start < len(text):
        # Determine chunk end
        end = start + target_size

        if end >= len(text):
            # Last chunk - take remaining text
            chunks.append({
                'content': text[start:],
                'start': start,
                'end': len(text)
            })
            break

        # Try to find good break point near target size
        break_point = find_break_point(text, end)

        chunks.append({
            'content': text[start:break_point],
            'start': start,
            'end': break_point
        })

        # Next chunk starts with overlap
        start = break_point - overlap

    return chunks
```

### Step 4: Quality Validation

For each chunk:
- ✅ Size within acceptable range (400-2000 chars)
- ✅ Contains complete sentences
- ✅ Has meaningful content (not just headers/footers)
- ✅ Language detected correctly
- ✅ No excessive special characters or artifacts

---

## Break Point Detection

### Preferred Break Points (in order)

1. **Section Headings** (highest priority)
   ```
   # Educación
   # Salud
   # Economía
   ```
   Break **before** the heading

2. **Paragraph Breaks**
   ```
   ... end of paragraph.\n\n
   Start of new paragraph ...
   ```
   Break at double line break

3. **List Boundaries**
   ```
   1. First item
   2. Second item
   [BREAK HERE]
   Next section text...
   ```

4. **Sentence Endings**
   ```
   ... end of sentence. Next sentence...
                      ↑ break here if needed
   ```
   Look for `. ` followed by capital letter

5. **Word Boundaries**
   ```
   ... some text here and more...
                         ↑ last resort
   ```
   Never break mid-word

### Break Point Algorithm

```python
def find_break_point(text, ideal_end, window=200):
    """
    Find best break point near ideal_end
    window: chars to search before/after ideal_end
    """
    search_start = max(ideal_end - window, 0)
    search_end = min(ideal_end + window, len(text))
    search_text = text[search_start:search_end]

    # 1. Look for section headings
    heading_pattern = r'\n\n#+\s+[A-ZÁÉÍÓÚÑ]'
    matches = re.finditer(heading_pattern, search_text)
    if matches:
        return search_start + min(m.start() for m in matches)

    # 2. Look for paragraph breaks
    para_breaks = [m.start() for m in re.finditer(r'\n\n', search_text)]
    if para_breaks:
        # Choose closest to ideal_end
        return search_start + min(para_breaks,
                                   key=lambda x: abs(x - (ideal_end - search_start)))

    # 3. Look for sentence endings
    sentence_ends = [m.end() for m in re.finditer(r'\.\s+[A-ZÁÉÍÓÚÑ]', search_text)]
    if sentence_ends:
        return search_start + min(sentence_ends,
                                   key=lambda x: abs(x - (ideal_end - search_start)))

    # 4. Look for any period
    periods = [m.end() for m in re.finditer(r'\.\s+', search_text)]
    if periods:
        return search_start + min(periods,
                                   key=lambda x: abs(x - (ideal_end - search_start)))

    # 5. Fallback: word boundary
    spaces = [m.end() for m in re.finditer(r'\s+', search_text)]
    if spaces:
        return search_start + min(spaces,
                                   key=lambda x: abs(x - (ideal_end - search_start)))

    # 6. Last resort: hard break at ideal_end
    return ideal_end
```

---

## Chunk Overlap Strategy

### Why Overlap?

- Preserves context at boundaries
- Handles sentences/thoughts split across chunks
- Improves retrieval of boundary content
- Small cost in storage (~10-15% overhead)

### Overlap Implementation

```
Chunk 1: [====================]
Chunk 2:              [overlap][====================]
Chunk 3:                                  [overlap][==========]

Characters:    0                1000              2000
```

### Overlap Metadata

Track overlap for deduplication:

```typescript
interface ChunkMetadata {
  overlap_chars: number;          // Size of overlap with previous chunk
  overlap_start: number;          // Where overlap starts in this chunk
  previous_chunk_id?: string;     // Link to previous chunk
  next_chunk_id?: string;         // Link to next chunk
}
```

---

## Special Cases

### Short Pages

**If page text < 800 characters:**
- Create single chunk (no splitting)
- No overlap needed
- Set `is_complete_page: true`

### Very Long Pages

**If page text > 10,000 characters:**
- Split into multiple chunks
- Maintain overlap between all chunks
- Preserve section structure

### Heading-Only Chunks

**If chunk is just a heading:**
- Include heading in next chunk
- Don't create standalone heading chunk
- Exception: If heading + first paragraph > max size

### Lists and Bullet Points

**Preserve list integrity:**
- Don't split mid-list if possible
- Keep list with preceding context
- If list too long, split between items

### Tables

**Handle tables specially:**
- Extract as separate chunk if large
- Include table caption/context
- Mark as `contains_table: true`
- May require special rendering

### Code/Technical Content

**For technical content:**
- Preserve code blocks
- Keep formulas together
- Maintain formatting

---

## Quality Metrics

### Chunk Quality Scoring

Calculate quality score (0-1) based on:

```python
def calculate_quality_score(chunk):
    score = 1.0

    # Size penalty
    if chunk.char_count < 500:
        score -= 0.2  # Too short
    elif chunk.char_count > 1800:
        score -= 0.1  # Too long

    # Completeness
    if not chunk.content.endswith(('.', '!', '?', ':')):
        score -= 0.1  # Incomplete sentence

    if not chunk.content[0].isupper():
        score -= 0.1  # Doesn't start with capital

    # Content quality
    word_count = len(chunk.content.split())
    if word_count < 50:
        score -= 0.2  # Too few words

    # Special character ratio
    special_char_ratio = len(re.findall(r'[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]', chunk.content)) / len(chunk.content)
    if special_char_ratio > 0.3:
        score -= 0.2  # Too many special chars (likely extraction issue)

    # Artifact detection
    if re.search(r'\d{1,3}\s*\|\s*Página', chunk.content):
        score -= 0.3  # Contains page number artifact

    return max(0.0, score)
```

### Validation Rules

Reject chunks that:
- ❌ Are < 400 characters
- ❌ Are > 2000 characters
- ❌ Have quality score < 0.3
- ❌ Are entirely numbers/symbols
- ❌ Contain excessive whitespace (>30%)
- ❌ Are duplicates of existing chunks

---

## Chunking Pipeline

### End-to-End Flow

```
PDF Page (raw text)
  ↓
Text Cleaning & Normalization
  ↓
Structure Detection
  (headings, paragraphs, lists)
  ↓
Semantic Segmentation
  (identify logical boundaries)
  ↓
Chunk Creation
  (split with overlap)
  ↓
Quality Validation
  (filter/fix poor chunks)
  ↓
Metadata Enrichment
  (add IDs, references)
  ↓
Output: Chunk Array
```

### Performance Considerations

- **Batch Processing**: Process multiple pages in parallel
- **Caching**: Cache segmentation results
- **Incremental Updates**: Only re-chunk changed pages

---

## Example Chunks

### Good Chunk Example

```json
{
  "id": "PLN_2026_p012_c001",
  "content": "Educación de Calidad para Todos\n\nNuestro plan de gobierno prioriza la educación como motor del desarrollo nacional. Proponemos aumentar la inversión en infraestructura educativa, capacitación docente y acceso a tecnología en las aulas. El objetivo es garantizar que todos los niños y jóvenes costarricenses tengan acceso a una educación de calidad, sin importar su ubicación geográfica o condición socioeconómica.\n\nInversión Propuesta:\n- Construcción de 50 nuevos centros educativos\n- Capacitación de 5,000 docentes en metodologías modernas\n- Dotación de tablets para 100,000 estudiantes de zonas rurales",
  "char_count": 642,
  "word_count": 89,
  "is_heading": true,
  "contains_numbers": true,
  "contains_bullet_list": true,
  "quality_score": 0.95,
  "section": "Educación"
}
```

### Poor Chunk Example (to avoid)

```json
{
  "id": "BAD_CHUNK",
  "content": "Página 12 | PLN 2026\n\n\n\n\n",
  "char_count": 28,
  "quality_score": 0.1,
  "rejection_reason": "Too short, artifact-only content"
}
```

---

## Testing Chunking Quality

### Manual Review

Sample 100 random chunks and verify:
- ✅ Semantically coherent
- ✅ Appropriate size
- ✅ Contains useful information
- ✅ No excessive artifacts
- ✅ Proper overlap with adjacent chunks

### Automated Metrics

- Average chunk size: 1000-1400 chars
- Chunk size std dev: < 400
- Quality score average: > 0.7
- Rejection rate: < 5%
- Overlap consistency: 95%+ chunks have proper overlap

---

## Future Improvements

### Advanced Chunking

- **Semantic Embeddings**: Use embeddings to detect topic boundaries
- **Hierarchical Chunking**: Parent chunks contain child chunks
- **Adaptive Sizing**: Adjust chunk size based on content density
- **Cross-Page Chunks**: Allow chunks to span page boundaries

### Context Preservation

- **Heading Inheritance**: Include parent section headings in chunk metadata
- **Context Windows**: Store surrounding paragraphs for expansion
- **Document Structure**: Maintain outline/hierarchy metadata
