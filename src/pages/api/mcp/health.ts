import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuth, AuthenticatedRequest } from '@/lib/api-auth';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return health status with user info
  res.status(200).json({
    status: 'healthy',
    user: {
      id: req.user!.id,
      email: req.user!.email
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}

// Export with authentication wrapper
export default withApiAuth(handler);