-- ============================================
-- SOPHISTICATED BLOCK-TYPE-AWARE EDITING SYSTEM
-- ============================================

-- 1. BASE SMART EDIT FUNCTION
-- Generic intelligent content editor with type awareness
CREATE OR REPLACE FUNCTION mcp_smart_edit_block(
    p_api_key TEXT,
    p_block_id UUID,
    p_operation TEXT,  -- 'replace', 'append', 'prepend', 'insert_at', 'delete_range', 'replace_all'
    p_params JSONB     -- Operation-specific parameters
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_new_content TEXT;
    v_result JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get block with ownership check
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Block not found or access denied');
    END IF;
    
    -- Process based on operation
    CASE p_operation
        WHEN 'replace' THEN
            v_new_content := regexp_replace(
                v_block.content,
                p_params->>'find',
                p_params->>'replace',
                COALESCE(p_params->>'flags', 'g')
            );
            
        WHEN 'replace_all' THEN
            v_new_content := replace(
                v_block.content,
                p_params->>'find',
                p_params->>'replace'
            );
            
        WHEN 'append' THEN
            v_new_content := v_block.content || COALESCE(p_params->>'text', '');
            
        WHEN 'prepend' THEN
            v_new_content := COALESCE(p_params->>'text', '') || v_block.content;
            
        WHEN 'insert_at' THEN
            DECLARE
                v_position INTEGER := COALESCE((p_params->>'position')::INTEGER, 0);
            BEGIN
                v_new_content := 
                    substring(v_block.content from 1 for v_position) ||
                    COALESCE(p_params->>'text', '') ||
                    substring(v_block.content from v_position + 1);
            END;
            
        WHEN 'delete_range' THEN
            DECLARE
                v_start INTEGER := (p_params->>'start')::INTEGER;
                v_end INTEGER := (p_params->>'end')::INTEGER;
            BEGIN
                v_new_content := 
                    substring(v_block.content from 1 for v_start - 1) ||
                    substring(v_block.content from v_end + 1);
            END;
            
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid operation');
    END CASE;
    
    -- Update the block
    UPDATE blocks
    SET 
        content = v_new_content,
        updated_at = NOW()
    WHERE id = p_block_id;
    
    -- Return success with details
    RETURN jsonb_build_object(
        'success', true,
        'block_id', p_block_id,
        'operation', p_operation,
        'old_length', length(v_block.content),
        'new_length', length(v_new_content),
        'changes_made', v_block.content != v_new_content
    );
END;
$$;

-- 2. TEXT BLOCK EDITOR
-- Specialized for markdown and text operations
CREATE OR REPLACE FUNCTION mcp_edit_text_block(
    p_api_key TEXT,
    p_block_id UUID,
    p_operation TEXT,
    p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_new_content TEXT;
    v_metadata JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get block
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND b.type = 'text'
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Text block not found or access denied');
    END IF;
    
    v_new_content := v_block.content;
    v_metadata := COALESCE(v_block.metadata, '{}'::jsonb);
    
    -- Text-specific operations
    CASE p_operation
        WHEN 'format_bold' THEN
            v_new_content := regexp_replace(
                v_new_content,
                p_params->>'text',
                '**' || (p_params->>'text') || '**',
                'g'
            );
            
        WHEN 'format_italic' THEN
            v_new_content := regexp_replace(
                v_new_content,
                p_params->>'text',
                '*' || (p_params->>'text') || '*',
                'g'
            );
            
        WHEN 'add_link' THEN
            v_new_content := regexp_replace(
                v_new_content,
                p_params->>'text',
                '[' || (p_params->>'text') || '](' || (p_params->>'url') || ')',
                'g'
            );
            
        WHEN 'add_tag' THEN
            -- Add tag to content
            v_new_content := v_new_content || ' #' || (p_params->>'tag');
            -- Update metadata tags array
            v_metadata := jsonb_set(
                v_metadata,
                '{tags}',
                COALESCE(v_metadata->'tags', '[]'::jsonb) || to_jsonb(p_params->>'tag')
            );
            
        WHEN 'extract_tags' THEN
            -- Extract all #tags from content
            v_metadata := jsonb_set(
                v_metadata,
                '{tags}',
                (SELECT jsonb_agg(DISTINCT tag)
                 FROM regexp_split_to_table(v_new_content, '\s+') AS word,
                      regexp_matches(word, '#(\w+)', 'g') AS tag)
            );
            
        WHEN 'add_quote' THEN
            v_new_content := v_new_content || E'\n\n> ' || 
                            replace(p_params->>'quote', E'\n', E'\n> ');
                            
        WHEN 'add_list_item' THEN
            v_new_content := v_new_content || E'\n- ' || (p_params->>'item');
            
        ELSE
            -- Fallback to generic smart edit
            RETURN mcp_smart_edit_block(p_api_key, p_block_id, p_operation, p_params);
    END CASE;
    
    -- Update block
    UPDATE blocks
    SET 
        content = v_new_content,
        metadata = v_metadata,
        updated_at = NOW()
    WHERE id = p_block_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'block_id', p_block_id,
        'operation', p_operation,
        'tags_count', jsonb_array_length(v_metadata->'tags')
    );
END;
$$;

-- 3. CODE BLOCK EDITOR
-- Advanced code manipulation with syntax awareness
CREATE OR REPLACE FUNCTION mcp_edit_code_block(
    p_api_key TEXT,
    p_block_id UUID,
    p_operation TEXT,
    p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_lines TEXT[];
    v_new_content TEXT;
    v_metadata JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get code block
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND b.type = 'code'
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Code block not found or access denied');
    END IF;
    
    v_metadata := COALESCE(v_block.metadata, '{}'::jsonb);
    v_lines := string_to_array(v_block.content, E'\n');
    
    -- Code-specific operations
    CASE p_operation
        WHEN 'insert_line' THEN
            DECLARE
                v_line_num INTEGER := COALESCE((p_params->>'line_number')::INTEGER, 1);
                v_line_text TEXT := COALESCE(p_params->>'text', '');
            BEGIN
                -- Insert line at specific position
                v_lines := array_cat(
                    v_lines[1:v_line_num-1],
                    ARRAY[v_line_text],
                    v_lines[v_line_num:array_length(v_lines, 1)]
                );
                v_new_content := array_to_string(v_lines, E'\n');
            END;
            
        WHEN 'delete_line' THEN
            DECLARE
                v_line_num INTEGER := (p_params->>'line_number')::INTEGER;
            BEGIN
                -- Remove specific line
                v_lines := array_cat(
                    v_lines[1:v_line_num-1],
                    v_lines[v_line_num+1:array_length(v_lines, 1)]
                );
                v_new_content := array_to_string(v_lines, E'\n');
            END;
            
        WHEN 'replace_function' THEN
            -- Replace entire function body
            v_new_content := regexp_replace(
                v_block.content,
                'function\s+' || (p_params->>'function_name') || '\s*\([^)]*\)\s*\{[^}]*\}',
                p_params->>'new_implementation',
                'g'
            );
            
        WHEN 'add_import' THEN
            -- Add import statement at top
            v_new_content := (p_params->>'import_statement') || E'\n' || v_block.content;
            
        WHEN 'rename_variable' THEN
            -- Rename all occurrences of a variable
            v_new_content := regexp_replace(
                v_block.content,
                '\b' || (p_params->>'old_name') || '\b',
                p_params->>'new_name',
                'g'
            );
            
        WHEN 'add_comment' THEN
            DECLARE
                v_line_num INTEGER := (p_params->>'line_number')::INTEGER;
                v_comment TEXT := p_params->>'comment';
                v_lang TEXT := COALESCE(v_metadata->>'language', 'javascript');
            BEGIN
                -- Add comment before specific line
                IF v_lang IN ('python', 'ruby', 'bash', 'yaml') THEN
                    v_lines[v_line_num] := '# ' || v_comment || E'\n' || v_lines[v_line_num];
                ELSIF v_lang IN ('html', 'xml') THEN
                    v_lines[v_line_num] := '<!-- ' || v_comment || ' -->' || E'\n' || v_lines[v_line_num];
                ELSE
                    v_lines[v_line_num] := '// ' || v_comment || E'\n' || v_lines[v_line_num];
                END IF;
                v_new_content := array_to_string(v_lines, E'\n');
            END;
            
        WHEN 'update_metadata' THEN
            -- Update code metadata (language, file path, version)
            v_metadata := v_metadata || p_params;
            v_new_content := v_block.content;
            
        ELSE
            -- Fallback to generic smart edit
            RETURN mcp_smart_edit_block(p_api_key, p_block_id, p_operation, p_params);
    END CASE;
    
    -- Update block
    UPDATE blocks
    SET 
        content = v_new_content,
        metadata = v_metadata,
        updated_at = NOW()
    WHERE id = p_block_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'block_id', p_block_id,
        'operation', p_operation,
        'line_count', array_length(string_to_array(v_new_content, E'\n'), 1),
        'language', v_metadata->>'language'
    );
END;
$$;

-- 4. TABLE BLOCK EDITOR
-- Cell-level table manipulation
CREATE OR REPLACE FUNCTION mcp_edit_table_block(
    p_api_key TEXT,
    p_block_id UUID,
    p_operation TEXT,
    p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_table_data JSONB;
    v_headers JSONB;
    v_rows JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get table block
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND b.type = 'table'
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Table block not found or access denied');
    END IF;
    
    -- Parse table data from metadata
    v_table_data := COALESCE(v_block.metadata, '{}'::jsonb);
    v_headers := COALESCE(v_table_data->'headers', '[]'::jsonb);
    v_rows := COALESCE(v_table_data->'rows', '[]'::jsonb);
    
    -- Table-specific operations
    CASE p_operation
        WHEN 'update_cell' THEN
            DECLARE
                v_row INTEGER := (p_params->>'row')::INTEGER;
                v_col INTEGER := (p_params->>'column')::INTEGER;
                v_value TEXT := p_params->>'value';
            BEGIN
                -- Update specific cell
                v_rows := jsonb_set(
                    v_rows,
                    ARRAY[v_row::TEXT, v_col::TEXT],
                    to_jsonb(v_value)
                );
            END;
            
        WHEN 'add_column' THEN
            DECLARE
                v_header TEXT := COALESCE(p_params->>'header', 'New Column');
                v_position INTEGER := COALESCE((p_params->>'position')::INTEGER, jsonb_array_length(v_headers));
            BEGIN
                -- Add header
                v_headers := v_headers || to_jsonb(v_header);
                -- Add empty cell to each row
                FOR i IN 0..jsonb_array_length(v_rows)-1 LOOP
                    v_rows := jsonb_set(
                        v_rows,
                        ARRAY[i::TEXT],
                        v_rows->i || to_jsonb('')
                    );
                END LOOP;
            END;
            
        WHEN 'delete_column' THEN
            DECLARE
                v_col INTEGER := (p_params->>'column')::INTEGER;
            BEGIN
                -- Remove header
                v_headers := v_headers - v_col;
                -- Remove cell from each row
                FOR i IN 0..jsonb_array_length(v_rows)-1 LOOP
                    v_rows := jsonb_set(
                        v_rows,
                        ARRAY[i::TEXT],
                        v_rows->i - v_col
                    );
                END LOOP;
            END;
            
        WHEN 'add_row' THEN
            DECLARE
                v_new_row JSONB := COALESCE(p_params->'values', 
                    (SELECT jsonb_agg('') FROM generate_series(1, jsonb_array_length(v_headers))));
            BEGIN
                v_rows := v_rows || jsonb_build_array(v_new_row);
            END;
            
        WHEN 'delete_row' THEN
            DECLARE
                v_row INTEGER := (p_params->>'row')::INTEGER;
            BEGIN
                v_rows := v_rows - v_row;
            END;
            
        WHEN 'sort_by_column' THEN
            DECLARE
                v_col INTEGER := (p_params->>'column')::INTEGER;
                v_order TEXT := COALESCE(p_params->>'order', 'asc');
            BEGIN
                -- Sort rows by specified column
                v_rows := (
                    SELECT jsonb_agg(row ORDER BY row->>v_col)
                    FROM jsonb_array_elements(v_rows) AS row
                );
                IF v_order = 'desc' THEN
                    v_rows := (
                        SELECT jsonb_agg(elem)
                        FROM (
                            SELECT elem 
                            FROM jsonb_array_elements(v_rows) WITH ORDINALITY AS t(elem, idx)
                            ORDER BY idx DESC
                        ) AS reversed
                    );
                END IF;
            END;
            
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid table operation');
    END CASE;
    
    -- Update table data
    v_table_data := jsonb_build_object(
        'headers', v_headers,
        'rows', v_rows,
        'columnAlignments', COALESCE(v_table_data->'columnAlignments', '[]'::jsonb),
        'hasHeaderRow', COALESCE(v_table_data->'hasHeaderRow', 'true'::jsonb)
    );
    
    -- Update block
    UPDATE blocks
    SET 
        metadata = v_table_data,
        updated_at = NOW()
    WHERE id = p_block_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'block_id', p_block_id,
        'operation', p_operation,
        'row_count', jsonb_array_length(v_rows),
        'column_count', jsonb_array_length(v_headers)
    );
END;
$$;

-- 5. TODO BLOCK EDITOR
-- Task management operations
CREATE OR REPLACE FUNCTION mcp_edit_todo_block(
    p_api_key TEXT,
    p_block_id UUID,
    p_operation TEXT,
    p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_todos JSONB;
    v_todo_item JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get todo block
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND b.type = 'todo'
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Todo block not found or access denied');
    END IF;
    
    -- Get todos array from metadata
    v_todos := COALESCE((v_block.metadata)->'todos', '[]'::jsonb);
    
    -- Todo-specific operations
    CASE p_operation
        WHEN 'toggle_status' THEN
            DECLARE
                v_todo_id TEXT := p_params->>'todo_id';
                v_index INTEGER;
            BEGIN
                -- Find and toggle todo status
                FOR v_index IN 0..jsonb_array_length(v_todos)-1 LOOP
                    IF v_todos->v_index->>'id' = v_todo_id THEN
                        v_todo_item := v_todos->v_index;
                        -- Toggle between todo/done
                        IF v_todo_item->>'status' = 'done' THEN
                            v_todo_item := jsonb_set(v_todo_item, '{status}', '"todo"');
                        ELSE
                            v_todo_item := jsonb_set(v_todo_item, '{status}', '"done"');
                        END IF;
                        v_todos := jsonb_set(v_todos, ARRAY[v_index::TEXT], v_todo_item);
                        EXIT;
                    END IF;
                END LOOP;
            END;
            
        WHEN 'update_todo' THEN
            DECLARE
                v_todo_id TEXT := p_params->>'todo_id';
                v_index INTEGER;
            BEGIN
                -- Update specific todo properties
                FOR v_index IN 0..jsonb_array_length(v_todos)-1 LOOP
                    IF v_todos->v_index->>'id' = v_todo_id THEN
                        v_todo_item := v_todos->v_index;
                        -- Update fields if provided
                        IF p_params ? 'text' THEN
                            v_todo_item := jsonb_set(v_todo_item, '{text}', p_params->'text');
                        END IF;
                        IF p_params ? 'status' THEN
                            v_todo_item := jsonb_set(v_todo_item, '{status}', p_params->'status');
                        END IF;
                        IF p_params ? 'priority' THEN
                            v_todo_item := jsonb_set(v_todo_item, '{priority}', p_params->'priority');
                        END IF;
                        IF p_params ? 'dueDate' THEN
                            v_todo_item := jsonb_set(v_todo_item, '{dueDate}', p_params->'dueDate');
                        END IF;
                        v_todos := jsonb_set(v_todos, ARRAY[v_index::TEXT], v_todo_item);
                        EXIT;
                    END IF;
                END LOOP;
            END;
            
        WHEN 'add_todo' THEN
            DECLARE
                v_new_todo JSONB;
            BEGIN
                v_new_todo := jsonb_build_object(
                    'id', gen_random_uuid()::TEXT,
                    'text', COALESCE(p_params->>'text', 'New task'),
                    'status', COALESCE(p_params->>'status', 'todo'),
                    'priority', p_params->'priority',
                    'dueDate', p_params->'dueDate',
                    'createdAt', NOW()::TEXT
                );
                v_todos := v_todos || v_new_todo;
            END;
            
        WHEN 'delete_todo' THEN
            DECLARE
                v_todo_id TEXT := p_params->>'todo_id';
            BEGIN
                -- Remove todo by filtering
                v_todos := (
                    SELECT jsonb_agg(todo)
                    FROM jsonb_array_elements(v_todos) AS todo
                    WHERE todo->>'id' != v_todo_id
                );
            END;
            
        WHEN 'bulk_update_status' THEN
            DECLARE
                v_status TEXT := p_params->>'status';
                v_ids JSONB := p_params->'todo_ids';
            BEGIN
                -- Update multiple todos' status
                v_todos := (
                    SELECT jsonb_agg(
                        CASE 
                            WHEN v_ids ? (todo->>'id')
                            THEN jsonb_set(todo, '{status}', to_jsonb(v_status))
                            ELSE todo
                        END
                    )
                    FROM jsonb_array_elements(v_todos) AS todo
                );
            END;
            
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid todo operation');
    END CASE;
    
    -- Update block metadata
    UPDATE blocks
    SET 
        metadata = jsonb_build_object('todos', v_todos),
        updated_at = NOW()
    WHERE id = p_block_id;
    
    -- Calculate stats
    DECLARE
        v_total INTEGER := jsonb_array_length(v_todos);
        v_done INTEGER := (
            SELECT COUNT(*)::INTEGER
            FROM jsonb_array_elements(v_todos) AS todo
            WHERE todo->>'status' = 'done'
        );
    BEGIN
        RETURN jsonb_build_object(
            'success', true,
            'block_id', p_block_id,
            'operation', p_operation,
            'total_todos', v_total,
            'completed', v_done,
            'pending', v_total - v_done,
            'completion_rate', CASE WHEN v_total > 0 THEN (v_done::FLOAT / v_total * 100)::INTEGER ELSE 0 END
        );
    END;
END;
$$;

-- 6. AI BLOCK EDITOR
-- Conversation manipulation
CREATE OR REPLACE FUNCTION mcp_edit_ai_block(
    p_api_key TEXT,
    p_block_id UUID,
    p_operation TEXT,
    p_params JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_messages JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get AI block
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND b.type = 'ai'
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'AI block not found or access denied');
    END IF;
    
    -- Get messages array
    v_messages := COALESCE((v_block.metadata)->'messages', '[]'::jsonb);
    
    -- AI conversation operations
    CASE p_operation
        WHEN 'add_message' THEN
            DECLARE
                v_new_message JSONB;
            BEGIN
                v_new_message := jsonb_build_object(
                    'role', COALESCE(p_params->>'role', 'user'),
                    'content', COALESCE(p_params->>'content', ''),
                    'timestamp', NOW()::TEXT
                );
                v_messages := v_messages || v_new_message;
            END;
            
        WHEN 'edit_message' THEN
            DECLARE
                v_index INTEGER := (p_params->>'index')::INTEGER;
            BEGIN
                IF v_index >= 0 AND v_index < jsonb_array_length(v_messages) THEN
                    v_messages := jsonb_set(
                        v_messages,
                        ARRAY[v_index::TEXT, 'content'],
                        p_params->'content'
                    );
                END IF;
            END;
            
        WHEN 'delete_message' THEN
            DECLARE
                v_index INTEGER := (p_params->>'index')::INTEGER;
            BEGIN
                v_messages := v_messages - v_index;
            END;
            
        WHEN 'switch_role' THEN
            DECLARE
                v_index INTEGER := (p_params->>'index')::INTEGER;
                v_current_role TEXT;
            BEGIN
                IF v_index >= 0 AND v_index < jsonb_array_length(v_messages) THEN
                    v_current_role := v_messages->v_index->>'role';
                    v_messages := jsonb_set(
                        v_messages,
                        ARRAY[v_index::TEXT, 'role'],
                        to_jsonb(CASE 
                            WHEN v_current_role = 'user' THEN 'assistant'
                            ELSE 'user'
                        END)
                    );
                END IF;
            END;
            
        WHEN 'trim_context' THEN
            DECLARE
                v_keep_last INTEGER := COALESCE((p_params->>'keep_last')::INTEGER, 10);
            BEGIN
                -- Keep only last N messages
                v_messages := (
                    SELECT jsonb_agg(msg)
                    FROM (
                        SELECT msg
                        FROM jsonb_array_elements(v_messages) WITH ORDINALITY AS t(msg, idx)
                        ORDER BY idx DESC
                        LIMIT v_keep_last
                    ) AS recent
                );
            END;
            
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Invalid AI operation');
    END CASE;
    
    -- Update block
    UPDATE blocks
    SET 
        metadata = jsonb_build_object('messages', v_messages),
        updated_at = NOW()
    WHERE id = p_block_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'block_id', p_block_id,
        'operation', p_operation,
        'message_count', jsonb_array_length(v_messages),
        'last_role', v_messages->-1->>'role'
    );
END;
$$;

-- 7. BLOCK TYPE TRANSFORMATION
-- Convert between block types intelligently
CREATE OR REPLACE FUNCTION mcp_transform_block_type(
    p_api_key TEXT,
    p_block_id UUID,
    p_new_type TEXT,
    p_options JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_block RECORD;
    v_new_content TEXT;
    v_new_metadata JSONB;
BEGIN
    -- Validate API key
    SELECT user_id INTO v_user_id FROM api_keys WHERE key_hash = crypt(p_api_key, key_hash);
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid API key');
    END IF;
    
    -- Get block
    SELECT b.*, d.user_id as doc_user_id
    INTO v_block
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = p_block_id 
    AND d.user_id = v_user_id
    AND b.deleted_at IS NULL;
    
    IF v_block IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Block not found or access denied');
    END IF;
    
    -- Transform based on source and target types
    CASE 
        WHEN v_block.type = 'text' AND p_new_type = 'code' THEN
            -- Text to code: preserve content, add language metadata
            v_new_content := v_block.content;
            v_new_metadata := jsonb_build_object(
                'language', COALESCE(p_options->>'language', 'plaintext')
            );
            
        WHEN v_block.type = 'code' AND p_new_type = 'text' THEN
            -- Code to text: add code fence
            v_new_content := '```' || COALESCE(v_block.metadata->>'language', '') || E'\n' ||
                           v_block.content || E'\n```';
            v_new_metadata := '{}'::jsonb;
            
        WHEN v_block.type = 'text' AND p_new_type = 'todo' THEN
            -- Text to todo: parse lines as tasks
            v_new_metadata := jsonb_build_object(
                'todos', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', gen_random_uuid()::TEXT,
                            'text', trim(line),
                            'status', 'todo'
                        )
                    )
                    FROM unnest(string_to_array(v_block.content, E'\n')) AS line
                    WHERE trim(line) != ''
                )
            );
            v_new_content := '';
            
        WHEN v_block.type = 'todo' AND p_new_type = 'text' THEN
            -- Todo to text: convert to bullet list
            v_new_content := (
                SELECT string_agg(
                    CASE todo->>'status'
                        WHEN 'done' THEN '- [x] ' || (todo->>'text')
                        ELSE '- [ ] ' || (todo->>'text')
                    END,
                    E'\n'
                )
                FROM jsonb_array_elements(v_block.metadata->'todos') AS todo
            );
            v_new_metadata := '{}'::jsonb;
            
        ELSE
            -- Default: preserve content
            v_new_content := COALESCE(v_block.content, '');
            v_new_metadata := COALESCE(v_block.metadata, '{}'::jsonb);
    END CASE;
    
    -- Update block type
    UPDATE blocks
    SET 
        type = p_new_type,
        content = v_new_content,
        metadata = v_new_metadata,
        updated_at = NOW()
    WHERE id = p_block_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'block_id', p_block_id,
        'old_type', v_block.type,
        'new_type', p_new_type,
        'content_preserved', v_new_content IS NOT NULL
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION mcp_smart_edit_block TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mcp_edit_text_block TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mcp_edit_code_block TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mcp_edit_table_block TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mcp_edit_todo_block TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mcp_edit_ai_block TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mcp_transform_block_type TO anon, authenticated;