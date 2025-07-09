-- Supabase Schema for Journey Log Compass (Fixed)
-- This schema fixes the immutability issue with generated columns

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create documents table without generated columns first
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_template BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  -- Add search_vector as a regular column instead of generated
  search_vector tsvector
);

-- Create blocks table without generated columns
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'code', 'heading', 'ai', 'table', 'filetree', 'todo', 'template', 'math')),
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}',
  extracted_tags TEXT[] DEFAULT '{}',
  language TEXT,
  file_path TEXT,
  version_of UUID REFERENCES public.blocks(id),
  -- Add search_vector as a regular column
  search_vector tsvector
);

-- Create document_links table for tracking [[Document]] style links
CREATE TABLE IF NOT EXISTS public.document_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  target_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(source_document_id, target_document_id)
);

-- Create images table for storing base64 images separately
CREATE TABLE IF NOT EXISTS public.images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create settings table for user settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, key)
);

-- Create indexes for performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_updated_at ON public.documents(updated_at DESC);
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX idx_documents_search ON public.documents USING GIN(search_vector);

CREATE INDEX idx_blocks_document_id ON public.blocks(document_id);
CREATE INDEX idx_blocks_position ON public.blocks(document_id, position);
CREATE INDEX idx_blocks_file_path ON public.blocks(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX idx_blocks_version_of ON public.blocks(version_of) WHERE version_of IS NOT NULL;
CREATE INDEX idx_blocks_search ON public.blocks USING GIN(search_vector);
CREATE INDEX idx_blocks_extracted_tags ON public.blocks USING GIN(extracted_tags);

CREATE INDEX idx_document_links_source ON public.document_links(source_document_id);
CREATE INDEX idx_document_links_target ON public.document_links(target_document_id);

CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_document_id ON public.images(document_id);
CREATE INDEX idx_images_block_id ON public.images(block_id);

CREATE INDEX idx_settings_user_id_key ON public.settings(user_id, key);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blocks
CREATE POLICY "Users can view blocks of their documents" ON public.blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = blocks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create blocks in their documents" ON public.blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = blocks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blocks in their documents" ON public.blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = blocks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blocks from their documents" ON public.blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = blocks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- RLS Policies for document_links
CREATE POLICY "Users can view links from their documents" ON public.document_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_links.source_document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links from their documents" ON public.document_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_links.source_document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links from their documents" ON public.document_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_links.source_document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- RLS Policies for images
CREATE POLICY "Users can view their own images" ON public.images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own images" ON public.images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON public.images
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for settings
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.settings
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_blocks_updated_at BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update document's updated_at when blocks change
CREATE OR REPLACE FUNCTION public.update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.documents 
  SET updated_at = timezone('utc'::text, now())
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update document timestamp when blocks change
CREATE TRIGGER update_document_on_block_change
  AFTER INSERT OR UPDATE OR DELETE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_document_timestamp();

-- Function to extract tags from text content
CREATE OR REPLACE FUNCTION public.extract_tags_from_content(content TEXT)
RETURNS TEXT[] AS $$
DECLARE
  tags TEXT[];
BEGIN
  -- Extract tags in format #tagname[text]
  SELECT ARRAY_AGG(DISTINCT matches[1])
  INTO tags
  FROM (
    SELECT regexp_matches(content, '#(\w+)\[', 'g') AS matches
  ) AS tag_matches;
  
  RETURN COALESCE(tags, '{}');
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors (called by triggers)
CREATE OR REPLACE FUNCTION public.update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_block_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    coalesce(NEW.content, '') || ' ' || 
    coalesce(array_to_string(NEW.extracted_tags, ' '), '')
  );
  -- Also extract tags if it's a text block
  IF NEW.type = 'text' THEN
    NEW.extracted_tags = public.extract_tags_from_content(NEW.content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
CREATE TRIGGER update_document_search_vector
  BEFORE INSERT OR UPDATE OF title ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_document_search_vector();

CREATE TRIGGER update_block_search_vector
  BEFORE INSERT OR UPDATE OF content ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_block_search_vector();

-- Storage buckets setup (to be created via Supabase dashboard or API)
-- 1. 'avatars' bucket for user profile pictures
-- 2. 'documents' bucket for document attachments
-- 3. 'images' bucket for inline images (if we migrate away from base64)