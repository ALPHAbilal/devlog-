[
  {
    "function_name": "save_document_blocks",
    "function_definition": "CREATE OR REPLACE FUNCTION public.save_document_blocks(doc_id uuid, blocks jsonb)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\r\nBEGIN\r\n  -- First, delete existing blocks for this document\r\n  -- Only deletes blocks that belong to the current user\r\n  DELETE FROM blocks \r\n  WHERE document_id = doc_id \r\n    AND user_id = auth.uid();\r\n  \r\n  -- Then insert new blocks\r\n  -- If blocks is empty array, no inserts happen (which is correct behavior)\r\n  INSERT INTO blocks (id, document_id, user_id, type, content, position, metadata, created_at)\r\n  SELECT \r\n    COALESCE((b->>'id')::UUID, gen_random_uuid()),  -- Use existing ID or generate new\r\n    doc_id,\r\n    auth.uid(),  -- Always use current user's ID\r\n    b->>'type',\r\n    b->>'content',\r\n    (b->>'position')::INTEGER,\r\n    COALESCE((b->>'metadata')::JSONB, '{}'::JSONB),  -- Default empty metadata if null\r\n    NOW()\r\n  FROM jsonb_array_elements(blocks) AS b;\r\n  \r\n  -- If any error occurs, the entire transaction is rolled back\r\n  -- This prevents the data loss issue\r\nEND;\r\n$function$\n",
    "can_execute": true
  }
]




[
  {
    "check_item": "Function exists",
    "status": true
  },
  {
    "check_item": "Unique constraint exists",
    "status": true
  },
  {
    "check_item": "Index exists",
    "status": true
  },
  {
    "check_item": "RLS is enabled on blocks",
    "status": true
  }
]