-- Check if blocks are being saved after the fix

-- 1. Check recent blocks (last 10 minutes)
SELECT 
    b.id,
    b.document_id,
    b.user_id,
    b.type,
    LEFT(b.content, 50) as content_preview,
    b.created_at,
    d.title as document_title
FROM blocks b
JOIN documents d ON b.document_id = d.id
WHERE b.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY b.created_at DESC;

-- 2. Count blocks per document
SELECT 
    d.id,
    d.title,
    d.user_id,
    COUNT(b.id) as block_count,
    MAX(b.created_at) as last_block_created,
    MAX(b.updated_at) as last_block_updated
FROM documents d
LEFT JOIN blocks b ON d.id = b.document_id
GROUP BY d.id, d.title, d.user_id
ORDER BY d.updated_at DESC;

-- 3. Check if all blocks now have user_id
SELECT 
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as blocks_with_user_id,
    COUNT(*) FILTER (WHERE user_id IS NULL) as blocks_without_user_id,
    COUNT(*) as total_blocks
FROM blocks;