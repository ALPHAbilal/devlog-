first query results:
| table_name     | table_type |
| -------------- | ---------- |
| blocks         | BASE TABLE |
| document_links | BASE TABLE |
| documents      | BASE TABLE |
| images         | BASE TABLE |
| profiles       | BASE TABLE |
| settings       | BASE TABLE |


second query results:
| column_name   | data_type                | is_nullable | column_default               |
| ------------- | ------------------------ | ----------- | ---------------------------- |
| id            | uuid                     | NO          | uuid_generate_v4()           |
| user_id       | uuid                     | NO          | null                         |
| title         | text                     | NO          | null                         |
| created_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| is_template   | boolean                  | YES         | false                        |
| tags          | ARRAY                    | YES         | '{}'::text[]                 |
| metadata      | jsonb                    | YES         | '{}'::jsonb                  |
| search_vector | tsvector                 | YES         | null                         |

-------------
| column_name    | data_type                | is_nullable | column_default               |
| -------------- | ------------------------ | ----------- | ---------------------------- |
| id             | uuid                     | NO          | uuid_generate_v4()           |
| document_id    | uuid                     | NO          | null                         |
| type           | text                     | NO          | null                         |
| content        | text                     | NO          | null                         |
| position       | integer                  | NO          | null                         |
| created_at     | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| updated_at     | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| metadata       | jsonb                    | YES         | '{}'::jsonb                  |
| extracted_tags | ARRAY                    | YES         | '{}'::text[]                 |
| language       | text                     | YES         | null                         |
| file_path      | text                     | YES         | null                         |
| version_of     | uuid                     | YES         | null                         |
| search_vector  | tsvector                 | YES         | null                         |
| user_id        | uuid                     | YES         | null                         |


third query results:
| tablename | indexname                  | indexdef                                                                                                    |
| --------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| blocks    | blocks_pkey                | CREATE UNIQUE INDEX blocks_pkey ON public.blocks USING btree (id)                                           |
| blocks    | idx_blocks_document_id     | CREATE INDEX idx_blocks_document_id ON public.blocks USING btree (document_id)                              |
| blocks    | idx_blocks_extracted_tags  | CREATE INDEX idx_blocks_extracted_tags ON public.blocks USING gin (extracted_tags)                          |
| blocks    | idx_blocks_file_path       | CREATE INDEX idx_blocks_file_path ON public.blocks USING btree (file_path) WHERE (file_path IS NOT NULL)    |
| blocks    | idx_blocks_position        | CREATE INDEX idx_blocks_position ON public.blocks USING btree (document_id, "position")                     |
| blocks    | idx_blocks_search          | CREATE INDEX idx_blocks_search ON public.blocks USING gin (search_vector)                                   |
| blocks    | idx_blocks_user_id         | CREATE INDEX idx_blocks_user_id ON public.blocks USING btree (user_id)                                      |
| blocks    | idx_blocks_version_of      | CREATE INDEX idx_blocks_version_of ON public.blocks USING btree (version_of) WHERE (version_of IS NOT NULL) |
| documents | documents_pkey             | CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id)                                     |
| documents | idx_documents_search       | CREATE INDEX idx_documents_search ON public.documents USING gin (search_vector)                             |
| documents | idx_documents_tags         | CREATE INDEX idx_documents_tags ON public.documents USING gin (tags)                                        |
| documents | idx_documents_updated_at   | CREATE INDEX idx_documents_updated_at ON public.documents USING btree (updated_at DESC)                     |
| documents | idx_documents_user_updated | CREATE INDEX idx_documents_user_updated ON public.documents USING btree (user_id, updated_at DESC)          |
| images    | idx_images_block_id        | CREATE INDEX idx_images_block_id ON public.images USING btree (block_id)                                    |
| images    | idx_images_document_id     | CREATE INDEX idx_images_document_id ON public.images USING btree (document_id)                              |
| images    | idx_images_user_id         | CREATE INDEX idx_images_user_id ON public.images USING btree (user_id)                                      |
| images    | images_pkey                | CREATE UNIQUE INDEX images_pkey ON public.images USING btree (id)                                           |
| profiles  | profiles_pkey              | CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)                                       |
| profiles  | profiles_username_key      | CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username)                         |
| settings  | idx_settings_user_id_key   | CREATE INDEX idx_settings_user_id_key ON public.settings USING btree (user_id, key)                         |
| settings  | settings_pkey              | CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id)                                       |
| settings  | settings_user_id_key_key   | CREATE UNIQUE INDEX settings_user_id_key_key ON public.settings USING btree (user_id, key)                  |


forth query results:
| table_name | constraint_name          | constraint_type | column_name | foreign_table_name | foreign_column_name |
| ---------- | ------------------------ | --------------- | ----------- | ------------------ | ------------------- |
| blocks     | blocks_document_id_fkey  | FOREIGN KEY     | document_id | documents          | id                  |
| blocks     | blocks_version_of_fkey   | FOREIGN KEY     | version_of  | blocks             | id                  |
| blocks     | blocks_user_id_fkey      | FOREIGN KEY     | user_id     | null               | null                |
| blocks     | blocks_pkey              | PRIMARY KEY     | id          | blocks             | id                  |
| documents  | documents_user_id_fkey   | FOREIGN KEY     | user_id     | null               | null                |
| documents  | documents_pkey           | PRIMARY KEY     | id          | documents          | id                  |
| images     | images_block_id_fkey     | FOREIGN KEY     | block_id    | blocks             | id                  |
| images     | images_document_id_fkey  | FOREIGN KEY     | document_id | documents          | id                  |
| images     | images_user_id_fkey      | FOREIGN KEY     | user_id     | null               | null                |
| images     | images_pkey              | PRIMARY KEY     | id          | images             | id                  |
| profiles   | profiles_id_fkey         | FOREIGN KEY     | id          | null               | null                |
| profiles   | profiles_pkey            | PRIMARY KEY     | id          | profiles           | id                  |
| profiles   | profiles_username_key    | UNIQUE          | username    | profiles           | username            |
| settings   | settings_user_id_fkey    | FOREIGN KEY     | user_id     | null               | null                |
| settings   | settings_pkey            | PRIMARY KEY     | id          | settings           | id                  |
| settings   | settings_user_id_key_key | UNIQUE          | key         | settings           | user_id             |
| settings   | settings_user_id_key_key | UNIQUE          | user_id     | settings           | key                 |
| settings   | settings_user_id_key_key | UNIQUE          | key         | settings           | key                 |
| settings   | settings_user_id_key_key | UNIQUE          | user_id     | settings           | user_id             |

five query results:
| schemaname | tablename      | RLS Enabled |
| ---------- | -------------- | ----------- |
| public     | blocks         | true        |
| public     | document_links | true        |
| public     | documents      | true        |
| public     | images         | true        |
| public     | profiles       | true        |
| public     | settings       | true        |

six query results:
| tablename      | policyname                                   | permissive | roles    | operation | qual                                                                                                                                     | with_check                                                                                                                               |
| -------------- | -------------------------------------------- | ---------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| blocks         | Users can create blocks in their documents   | PERMISSIVE | {public} | INSERT    | null                                                                                                                                     | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = blocks.document_id) AND (documents.user_id = auth.uid()))))                |
| blocks         | Users can delete blocks from their documents | PERMISSIVE | {public} | DELETE    | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = blocks.document_id) AND (documents.user_id = auth.uid()))))                | null                                                                                                                                     |
| blocks         | Users can update blocks in their documents   | PERMISSIVE | {public} | UPDATE    | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = blocks.document_id) AND (documents.user_id = auth.uid()))))                | null                                                                                                                                     |
| blocks         | Users can view blocks in their documents     | PERMISSIVE | {public} | SELECT    | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = blocks.document_id) AND (documents.user_id = auth.uid()))))                | null                                                                                                                                     |
| document_links | Users can create links from their documents  | PERMISSIVE | {public} | INSERT    | null                                                                                                                                     | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = document_links.source_document_id) AND (documents.user_id = auth.uid())))) |
| document_links | Users can delete links from their documents  | PERMISSIVE | {public} | DELETE    | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = document_links.source_document_id) AND (documents.user_id = auth.uid())))) | null                                                                                                                                     |
| document_links | Users can view links from their documents    | PERMISSIVE | {public} | SELECT    | (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = document_links.source_document_id) AND (documents.user_id = auth.uid())))) | null                                                                                                                                     |
| documents      | Users can create their own documents         | PERMISSIVE | {public} | INSERT    | null                                                                                                                                     | (auth.uid() = user_id)                                                                                                                   |
| documents      | Users can delete their own documents         | PERMISSIVE | {public} | DELETE    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |
| documents      | Users can update their own documents         | PERMISSIVE | {public} | UPDATE    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |
| documents      | Users can view own documents                 | PERMISSIVE | {public} | SELECT    | (user_id = ( SELECT auth.uid() AS uid))                                                                                                  | null                                                                                                                                     |
| images         | Users can delete their own images            | PERMISSIVE | {public} | DELETE    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |
| images         | Users can upload their own images            | PERMISSIVE | {public} | INSERT    | null                                                                                                                                     | (auth.uid() = user_id)                                                                                                                   |
| images         | Users can view their own images              | PERMISSIVE | {public} | SELECT    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |
| profiles       | Users can update their own profile           | PERMISSIVE | {public} | UPDATE    | (auth.uid() = id)                                                                                                                        | null                                                                                                                                     |
| profiles       | Users can view their own profile             | PERMISSIVE | {public} | SELECT    | (auth.uid() = id)                                                                                                                        | null                                                                                                                                     |
| settings       | Users can create their own settings          | PERMISSIVE | {public} | INSERT    | null                                                                                                                                     | (auth.uid() = user_id)                                                                                                                   |
| settings       | Users can delete their own settings          | PERMISSIVE | {public} | DELETE    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |
| settings       | Users can update their own settings          | PERMISSIVE | {public} | UPDATE    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |
| settings       | Users can view their own settings            | PERMISSIVE | {public} | SELECT    | (auth.uid() = user_id)                                                                                                                   | null                                                                                                                                     |

seven query results:
| trigger_name                    | event_object_table | event_manipulation | action_timing | action_statement                                 |
| ------------------------------- | ------------------ | ------------------ | ------------- | ------------------------------------------------ |
| handle_blocks_updated_at        | blocks             | UPDATE             | BEFORE        | EXECUTE FUNCTION handle_updated_at()             |
| set_block_user_id_trigger       | blocks             | INSERT             | BEFORE        | EXECUTE FUNCTION set_block_user_id()             |
| update_block_search_vector      | blocks             | INSERT             | BEFORE        | EXECUTE FUNCTION update_block_search_vector()    |
| update_block_search_vector      | blocks             | UPDATE             | BEFORE        | EXECUTE FUNCTION update_block_search_vector()    |
| update_document_on_block_change | blocks             | UPDATE             | AFTER         | EXECUTE FUNCTION update_document_timestamp()     |
| update_document_on_block_change | blocks             | INSERT             | AFTER         | EXECUTE FUNCTION update_document_timestamp()     |
| update_document_on_block_change | blocks             | DELETE             | AFTER         | EXECUTE FUNCTION update_document_timestamp()     |
| handle_documents_updated_at     | documents          | UPDATE             | BEFORE        | EXECUTE FUNCTION handle_updated_at()             |
| update_document_search_vector   | documents          | INSERT             | BEFORE        | EXECUTE FUNCTION update_document_search_vector() |
| update_document_search_vector   | documents          | UPDATE             | BEFORE        | EXECUTE FUNCTION update_document_search_vector() |
| handle_profiles_updated_at      | profiles           | UPDATE             | BEFORE        | EXECUTE FUNCTION handle_updated_at()             |
| handle_settings_updated_at      | settings           | UPDATE             | BEFORE        | EXECUTE FUNCTION handle_updated_at()             |

eight query results:
[
  {
    "routine_name": "extract_tags_from_content",
    "routine_type": "FUNCTION",
    "return_type": "ARRAY",
    "routine_definition": "\nDECLARE\n  tags TEXT[];\nBEGIN\n  -- Extract tags in format #tagname[text]\n  SELECT ARRAY_AGG(DISTINCT matches[1])\n  INTO tags\n  FROM (\n    SELECT regexp_matches(content, '#(\\w+)\\[', 'g') AS matches\n  ) AS tag_matches;\n  \n  RETURN COALESCE(tags, '{}');\nEND;\n"
  },
  {
    "routine_name": "handle_updated_at",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n  NEW.updated_at = timezone('utc'::text, now());\n  RETURN NEW;\nEND;\n"
  },
  {
    "routine_name": "set_block_user_id",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\r\n  BEGIN\r\n    NEW.user_id := (SELECT user_id FROM public.documents WHERE id = NEW.document_id);\r\n    RETURN NEW;\r\n  END;\r\n  "
  },
  {
    "routine_name": "update_block_search_vector",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n  NEW.search_vector := to_tsvector('english', \n    coalesce(NEW.content, '') || ' ' || \n    coalesce(array_to_string(NEW.extracted_tags, ' '), '')\n  );\n  -- Also extract tags if it's a text block\n  IF NEW.type = 'text' THEN\n    NEW.extracted_tags = public.extract_tags_from_content(NEW.content);\n  END IF;\n  RETURN NEW;\nEND;\n"
  },
  {
    "routine_name": "update_document_search_vector",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, ''));\n  RETURN NEW;\nEND;\n"
  },
  {
    "routine_name": "update_document_timestamp",
    "routine_type": "FUNCTION",
    "return_type": "trigger",
    "routine_definition": "\nBEGIN\n  UPDATE public.documents \n  SET updated_at = timezone('utc'::text, now())\n  WHERE id = COALESCE(NEW.document_id, OLD.document_id);\n  RETURN NEW;\nEND;\n"
  },
  {
    "routine_name": "user_owns_document",
    "routine_type": "FUNCTION",
    "return_type": "boolean",
    "routine_definition": "\r\n  BEGIN\r\n    RETURN EXISTS (\r\n      SELECT 1 FROM public.documents\r\n      WHERE id = doc_id\r\n      AND user_id = (SELECT auth.uid())\r\n    );\r\n  END;\r\n  "
  }
]

nine query results:
[
  {
    "table_name": "documents",
    "row_count": 4,
    "unique_users": 1,
    "oldest_record": "2025-06-27 20:56:13.552+00",
    "newest_record": "2025-06-27 21:38:26.833+00"
  },
  {
    "table_name": "blocks",
    "row_count": 1,
    "unique_users": 1,
    "oldest_record": "2025-06-27 22:14:11.72362+00",
    "newest_record": "2025-06-27 22:14:11.72362+00"
  },
  {
    "table_name": "profiles",
    "row_count": 0,
    "unique_users": null,
    "oldest_record": null,
    "newest_record": null
  },
  {
    "table_name": "settings",
    "row_count": 0,
    "unique_users": 0,
    "oldest_record": null,
    "newest_record": null
  },
  {
    "table_name": "images",
    "row_count": 0,
    "unique_users": 0,
    "oldest_record": null,
    "newest_record": null
  }
]

ten query results:
| extension_name     | version |
| ------------------ | ------- |
| pg_graphql         | 1.5.11  |
| pg_stat_statements | 1.11    |
| pgcrypto           | 1.3     |
| plpgsql            | 1.0     |
| supabase_vault     | 0.3.1   |
| uuid-ossp          | 1.1     |
