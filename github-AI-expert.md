## Critical Answers for Your Block Field Mapping & Batch Save Issue

---

### 1. **Field Mapping Solution**  
**konstantinmuenster/notion-clone** and **makenotion/notion-clone** do **not** use a `metadata` column for blocks; they use `data` (or sometimes `html`, `tag`, etc.).  
**No repo found does explicit `data`→`metadata` mapping out-of-the-box.**

**EXACT mapping code you need (JavaScript → SQL):**

```javascript
// Transform block before sending to RPC
const dbBlock = {
  id: block.id,
  type: block.type,
  content: block.content,
  position: block.position,
  metadata: block.data, // CRITICAL: maps frontend "data" to DB "metadata"
};
```

---

### 2. **Working RPC Function**

**COMPLETE Supabase/PostgreSQL RPC Function:**  
This maps `data` (frontend) → `metadata` (DB), upserts all required fields, and returns count.

```sql
CREATE OR REPLACE FUNCTION bulk_upsert_blocks(blocks jsonb)
RETURNS integer AS $$
DECLARE
  saved_count integer := 0;
BEGIN
  -- Atomic batch upsert
  WITH upsert AS (
    INSERT INTO blocks (id, type, content, position, metadata)
    SELECT
      (value->>'id')::uuid,
      value->>'type',
      value->>'content',
      (value->>'position')::int,
      value->'data' -- CRITICAL: maps "data" to metadata jsonb column
    FROM jsonb_array_elements(blocks) AS value
    ON CONFLICT (id) DO UPDATE
      SET
        type = EXCLUDED.type,
        content = EXCLUDED.content,
        position = EXCLUDED.position,
        metadata = EXCLUDED.metadata
    RETURNING id
  )
  SELECT count(*) INTO saved_count FROM upsert;
  RETURN saved_count;
END;
$$ LANGUAGE plpgsql;
```
**This is the exact mapping and batch logic you need.**

---

### 3. **SaveManager Integration**

**konstantinmuenster/notion-clone SaveManager:**  
No automatic renaming. You must transform blocks before RPC:

```javascript
// Inside saveBlocksBatch or before calling RPC:
const preparedBlocks = blocks.map(block => ({
  ...block,
  metadata: block.data, // CRITICAL: rename "data" → "metadata"
  data: undefined,      // Optional: remove original "data"
}));
await supabase.rpc("bulk_upsert_blocks", { blocks: preparedBlocks });
```
**You must do this transformation in your SaveManager (or equivalent function).**

---

### 4. **Quick Answers**

- Do ANY of these repos handle data→metadata mapping? **N**
- Do they ALL use simple INSERT ON CONFLICT? **Y**
- Any use separate UPDATE vs INSERT detection? **N**
- Best repo for our exact use case? **konstantinmuenster/notion-clone**

---

### **Most Important: Mapping Snippet**

**JavaScript (before RPC):**
```javascript
metadata: block.data
```
**SQL (inside RPC function):**
```sql
value->'data' as metadata
```

---

**Browse the exact SaveManager mapping pattern here:**  
- [SaveManager code search in konstantinmuenster/notion-clone](https://github.com/search?q=SaveManager+repo%3Akonstantinmuenster%2Fnotion-clone&type=code)

**Browse bulk upsert patterns here:**  
- [bulk_upsert_blocks code search](https://github.com/search?q=bulk_upsert_blocks&type=code)

---

If you need the precise file/line for any above, let me know!