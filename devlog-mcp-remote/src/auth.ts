interface AuthResult {
  valid: boolean;
  userId?: string;
  projectId?: string;
  tier?: 'free' | 'pro' | 'team' | 'enterprise';
  error?: string;
}

interface APIKey {
  key: string;
  userId: string;
  projectId: string;
  scopes: string[];
  tier: string;
  rateLimit: {
    requests: number;
    window: string;
  };
}

export async function authenticateRequest(request: Request, env: any): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Missing or invalid Authorization header',
    };
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Validate API key format (dvlg_sk_prod_xxxxx or dvlg_sk_test_xxxxx)
  if (!apiKey.startsWith('dvlg_sk_')) {
    return {
      valid: false,
      error: 'Invalid API key format',
    };
  }

  try {
    const keyParts = apiKey.split('_');
    const environment = keyParts[2]; // 'prod' or 'test'
    
    if (environment === 'test') {
      // Test key for development
      return {
        valid: true,
        userId: 'test-user-id',
        projectId: 'test-project-id',
        tier: 'free',
      };
    }

    // Production key validation with Supabase
    if (environment === 'prod' && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      // Hash the API key
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Call Supabase to validate the key
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/validate_api_key`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_key_hash: keyHash })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.length > 0 && result[0].is_valid) {
          return {
            valid: true,
            userId: result[0].user_id,
            projectId: 'devlog-' + result[0].user_id,
            tier: 'pro', // You could store tier in user_metadata
          };
        }
      }
    }

    // Fallback for demo/development
    return {
      valid: false,
      error: 'Invalid API key',
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      valid: false,
      error: 'Authentication failed',
    };
  }
}

function generateHash(input: string): string {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function checkRateLimit(
  env: any,
  userId: string,
  tier: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limits = {
    free: { requests: 10, window: 60 }, // 10 requests per minute
    pro: { requests: 100, window: 60 }, // 100 requests per minute
    team: { requests: 500, window: 60 }, // 500 requests per minute
    enterprise: { requests: 1000, window: 60 }, // 1000 requests per minute
  };

  const limit = limits[tier as keyof typeof limits] || limits.free;
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / 1000 / limit.window)}`;

  try {
    const current = await env.CACHE.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit.requests) {
      return { allowed: false, remaining: 0 };
    }

    await env.CACHE.put(key, String(count + 1), {
      expirationTtl: limit.window,
    });

    return { allowed: true, remaining: limit.requests - count - 1 };
  } catch (error) {
    // On error, allow the request but log it
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: -1 };
  }
}