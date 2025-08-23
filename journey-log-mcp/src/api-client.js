export class ApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://devlog.design/api/mcp';
    this.remoteUrl = 'https://devlog-mcp.bilal-kosika.workers.dev/api/execute';
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

  // Remote MCP call for folder operations
  async remoteMcpCall(toolName, args) {
    const response = await fetch(this.remoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        tool: toolName,
        arguments: args,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Remote MCP Error: ${response.status}`);
    }

    return data.result;
  }

  // Folder operations - proxy to remote MCP
  async createFolder({ name, parent_id, color, icon }) {
    return this.remoteMcpCall('create_folder', {
      name,
      parent_id,
      color,
      icon,
    });
  }

  async listFolders({ parent_id, include_documents } = {}) {
    return this.remoteMcpCall('list_folders', {
      parent_id,
      include_documents,
    });
  }

  async getFolderContents({ folder_id, include_subfolders }) {
    return this.remoteMcpCall('get_folder_contents', {
      folder_id,
      include_subfolders,
    });
  }

  async moveDocumentToFolder({ document_id, folder_id }) {
    return this.remoteMcpCall('move_document_to_folder', {
      document_id,
      folder_id,
    });
  }

  async deleteFolder({ folder_id, recursive }) {
    return this.remoteMcpCall('delete_folder', {
      folder_id,
      recursive,
    });
  }

  async updateFolder({ folder_id, name, color, icon, is_favorite, parent_id }) {
    return this.remoteMcpCall('update_folder', {
      folder_id,
      name,
      color,
      icon,
      is_favorite,
      parent_id,
    });
  }
}