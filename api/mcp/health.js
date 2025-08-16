export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return health status
  res.status(200).json({
    status: 'ok',
    message: 'MCP API is running',
    timestamp: new Date().toISOString(),
  });
}