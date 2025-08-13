# Journey Log MCP API Documentation

## Base URL
```
https://devlog.design/api/mcp
```

## Authentication
All endpoints (except `/health`) require Bearer token authentication:
```
Authorization: Bearer jl_your-api-key-here
```

## Endpoints

### Health Check
```
GET /health
```
No authentication required. Returns API status.

**Response:**
```json
{
  "status": "ok",
  "message": "MCP API is running",
  "timestamp": "2024-01-30T12:00:00.000Z"
}
```

### Create Document
```
POST /documents/create
```

**Request Body:**
```json
{
  "title": "My Document",
  "content": "Initial content (optional)",
  "tags": ["tag1", "tag2"],
  "metadata": {}
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "My Document",
  "tags": ["tag1", "tag2"],
  "url": "https://devlog.design/document/uuid",
  "created_at": "2024-01-30T12:00:00.000Z",
  "message": "Document created successfully"
}
```

### List Documents
```
GET /documents/list?limit=50&offset=0&tags=tag1,tag2&search=query
```

**Query Parameters:**
- `limit` (optional): Max documents to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `tags` (optional): Comma-separated tags to filter
- `search` (optional): Search in document titles

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Document Title",
      "tags": ["tag1"],
      "created_at": "2024-01-30T12:00:00.000Z",
      "updated_at": "2024-01-30T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Get Document
```
GET /documents/{id}
```

**Response:**
```json
{
  "document": {
    "id": "uuid",
    "title": "Document Title",
    "tags": ["tag1"],
    "created_at": "2024-01-30T12:00:00.000Z",
    "updated_at": "2024-01-30T12:00:00.000Z"
  },
  "blocks": [
    {
      "id": "uuid",
      "type": "text",
      "content": "Block content",
      "position": 0,
      "metadata": {}
    }
  ]
}
```

### Create Block
```
POST /blocks/create
```

**Request Body:**
```json
{
  "document_id": "uuid",
  "type": "text|code|heading|list|checkbox|ai_conversation",
  "content": "Block content",
  "metadata": {
    "language": "javascript",
    "level": 2
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "type": "code",
  "position": 1,
  "created_at": "2024-01-30T12:00:00.000Z",
  "message": "code block added to document \"Document Title\""
}
```

### Capture AI Conversation
```
POST /conversations/capture
```

**Request Body:**
```json
{
  "document_id": "uuid",
  "conversation": [
    {
      "role": "user",
      "content": "User message"
    },
    {
      "role": "assistant",
      "content": "Assistant response"
    }
  ],
  "context": "Optional context",
  "code_changes": [
    {
      "file": "src/app.js",
      "before": "old code",
      "after": "new code",
      "description": "Fixed bug"
    }
  ],
  "summary": "Optional summary"
}
```

**Response:**
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "message_count": 2,
  "has_code_changes": true,
  "summary": "Conversation summary",
  "message": "AI conversation with 2 messages captured in \"Document Title\""
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

### 429 Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "message": "Specific validation error message"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limits
- General endpoints: 100 requests per minute
- Block creation: 200 requests per minute
- Conversation capture: 50 requests per minute

## Testing
Use the provided `test-mcp-api.js` script to test all endpoints:
```bash
node test-mcp-api.js
```