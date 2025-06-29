-- Fix performance issues identified by Supabase advisors
-- 1. Add missing index on documents.user_id
-- 2. Optimize RLS policies to use SELECT subqueries
-- 3. Remove unused index on images.storage_path

-- Add index on documents.user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Drop the unused index on images.storage_path
DROP INDEX IF EXISTS idx_images_storage_path;

-- Optimize RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Optimize RLS policies for documents table
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
CREATE POLICY "Users can create their own documents" ON public.documents
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents" ON public.documents
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Optimize RLS policies for blocks table (more complex due to join)
DROP POLICY IF EXISTS "Users can select blocks" ON public.blocks;
CREATE POLICY "Users can select blocks" ON public.blocks
FOR SELECT USING (
  (SELECT auth.uid()) = user_id OR 
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = blocks.document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert blocks" ON public.blocks;
CREATE POLICY "Users can insert blocks" ON public.blocks
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user_id OR 
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = blocks.document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update blocks" ON public.blocks;
CREATE POLICY "Users can update blocks" ON public.blocks
FOR UPDATE USING (
  (SELECT auth.uid()) = user_id OR 
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = blocks.document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete blocks" ON public.blocks;
CREATE POLICY "Users can delete blocks" ON public.blocks
FOR DELETE USING (
  (SELECT auth.uid()) = user_id OR 
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = blocks.document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);

-- Optimize RLS policies for images table
DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
CREATE POLICY "Users can view their own images" ON public.images
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can upload their own images" ON public.images;
CREATE POLICY "Users can upload their own images" ON public.images
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;
CREATE POLICY "Users can delete their own images" ON public.images
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Optimize RLS policies for settings table
DROP POLICY IF EXISTS "Users can view their own settings" ON public.settings;
CREATE POLICY "Users can view their own settings" ON public.settings
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own settings" ON public.settings;
CREATE POLICY "Users can create their own settings" ON public.settings
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.settings;
CREATE POLICY "Users can update their own settings" ON public.settings
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.settings;
CREATE POLICY "Users can delete their own settings" ON public.settings
FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Optimize RLS policies for document_links table
DROP POLICY IF EXISTS "Users can view links from their documents" ON public.document_links;
CREATE POLICY "Users can view links from their documents" ON public.document_links
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_links.source_document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create links from their documents" ON public.document_links;
CREATE POLICY "Users can create links from their documents" ON public.document_links
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_links.source_document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete links from their documents" ON public.document_links;
CREATE POLICY "Users can delete links from their documents" ON public.document_links
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_links.source_document_id 
    AND documents.user_id = (SELECT auth.uid())
  )
);