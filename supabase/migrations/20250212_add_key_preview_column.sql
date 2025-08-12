-- Add key_preview column to api_keys table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='api_keys' AND column_name='key_preview'
    ) THEN
        ALTER TABLE api_keys ADD COLUMN key_preview text;
    END IF;
END $$;

-- Update existing keys to have a preview (if any exist without one)
UPDATE api_keys 
SET key_preview = 
    CASE 
        WHEN key_hash IS NOT NULL THEN 
            'dvlg_sk_****' || SUBSTRING(key_hash FROM LENGTH(key_hash) - 3)
        ELSE NULL
    END
WHERE key_preview IS NULL;