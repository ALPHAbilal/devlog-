-- Fix missing share code generation trigger
-- This migration recreates the auto-generation logic that was lost in the revert migration

-- Function to generate share codes in XXX-XXX-XXX format
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  -- Generate XXX-XXX-XXX format
  FOR i IN 1..9 LOOP
    IF i IN (4, 7) THEN
      result := result || '-';
    END IF;
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate share codes
CREATE OR REPLACE FUNCTION trigger_generate_share_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    LOOP
      NEW.share_code := generate_share_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM document_shares 
        WHERE share_code = NEW.share_code
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER generate_share_code_trigger
  BEFORE INSERT ON document_shares
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_share_code();