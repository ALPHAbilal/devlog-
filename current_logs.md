ERROR:  2BP01: cannot drop function user_document_ids() because other objects depend on it
DETAIL:  policy Users can view blocks (optimized) on table blocks depends on function user_document_ids()
policy Users can create blocks (optimized) on table blocks depends on function user_document_ids()
policy Users can update blocks (optimized) on table blocks depends on function user_document_ids()
policy Users can delete blocks (optimized) on table blocks depends on function user_document_ids()
policy Users can view links (optimized) on table document_links depends on function user_document_ids()
policy Users can create links (optimized) on table document_links depends on function user_document_ids()
policy Users can delete links (optimized) on table document_links depends on function user_document_ids()
policy Users can view cache for their documents on table document_cache depends on function user_document_ids()
HINT:  Use DROP ... CASCADE to drop the dependent objects too.