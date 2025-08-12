export class SupabaseClient {
  private url: string;
  private apiKey: string;
  private userId: string;

  constructor(url: string, apiKey: string, userId: string) {
    this.url = url;
    this.apiKey = apiKey;
    this.userId = userId;
  }

  private async request(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.url}${path}`, options);
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createDocument(data: {
    title: string;
    content?: string;
    tags?: string[];
  }): Promise<any> {
    const document = await this.request('POST', '/rest/v1/documents', {
      title: data.title,
      tags: data.tags || [],
      user_id: this.userId,
    });

    // If initial content provided, create a text block
    if (data.content) {
      await this.addBlock({
        document_id: document.id,
        type: 'text',
        content: data.content,
        metadata: {},
      });
    }

    return document;
  }

  async addBlock(data: {
    document_id: string;
    type: string;
    content: string;
    metadata?: any;
  }): Promise<any> {
    const position = await this.getNextBlockPosition(data.document_id);
    
    return this.request('POST', '/rest/v1/blocks', {
      document_id: data.document_id,
      type: data.type,
      content: data.content,
      metadata: data.metadata || {},
      position,
      user_id: this.userId,
    });
  }

  async getDocument(documentId: string): Promise<any> {
    // Get document metadata
    const [document] = await this.request(
      'GET',
      `/rest/v1/documents?id=eq.${documentId}&user_id=eq.${this.userId}`
    );

    if (!document) {
      throw new Error('Document not found');
    }

    // Get blocks
    const blocks = await this.request(
      'GET',
      `/rest/v1/blocks?document_id=eq.${documentId}&deleted_at=is.null&order=position`
    );

    return { document, blocks };
  }

  async listDocuments(params: {
    limit?: number;
    offset?: number;
    tags?: string[];
    search?: string;
  }): Promise<any> {
    let query = `/rest/v1/documents?user_id=eq.${this.userId}&deleted_at=is.null`;
    
    if (params.search) {
      query += `&title=ilike.*${encodeURIComponent(params.search)}*`;
    }

    if (params.tags && params.tags.length > 0) {
      query += `&tags=cs.{${params.tags.join(',')}}`;
    }

    query += `&order=updated_at.desc`;
    query += `&limit=${params.limit || 50}`;
    query += `&offset=${params.offset || 0}`;

    const response = await fetch(`${this.url}${query}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'apikey': this.apiKey,
        'Range': `${params.offset || 0}-${(params.offset || 0) + (params.limit || 50) - 1}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact',
      },
    });

    const documents = await response.json();
    const total = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');

    return {
      documents,
      pagination: {
        total,
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    };
  }

  private async getNextBlockPosition(documentId: string): Promise<number> {
    const blocks = await this.request(
      'GET',
      `/rest/v1/blocks?document_id=eq.${documentId}&deleted_at=is.null&order=position.desc&limit=1`
    );

    return blocks.length > 0 ? blocks[0].position + 1 : 0;
  }
}