#!/bin/bash

# Test Cloudflare API Token
echo "Testing Cloudflare API Token..."

# Replace with your actual token
export CLOUDFLARE_API_TOKEN="your_token_here"

# Test the token by verifying it
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json"

echo ""
echo "If you see 'success: true' above, your token is valid!"