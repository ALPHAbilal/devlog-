export class ApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://devlog.design/api/mcp';
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  }

  async createDocument({ title, content, tags = [], metadata = {} }) {
    return this.request('POST', '/documents/create', {
      title,
      content,
      tags,
      metadata,
    });
  }

  async addBlock({ document_id, type, content, metadata = {} }) {
    return this.request('POST', '/blocks/create', {
      document_id,
      type,
      content,
      metadata,
    });
  }

  async captureConversation({ document_id, conversation, context, summary, code_changes }) {
    return this.request('POST', '/conversations/capture', {
      document_id,
      conversation,
      context,
      summary,
      code_changes,
    });
  }

  async listDocuments({ limit = 50, offset = 0, tags, search } = {}) {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','));
    }
    if (search) {
      params.append('search', search);
    }
    
    return this.request('GET', `/documents/list?${params.toString()}`);
  }

  async getDocument(documentId) {
    return this.request('GET', `/documents/${documentId}`);
  }
}