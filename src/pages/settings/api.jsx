import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContextOptimized'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import Layout from '../../components/Layout'
import { Key, Copy, Trash2, Plus } from 'lucide-react'

export default function ApiKeysPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    loadApiKeys()
  }, [user, navigate])

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      toast.error('Failed to load API keys')
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    setCreating(true)
    try {
      // Generate a secure random API key
      const keyBytes = new Uint8Array(32)
      crypto.getRandomValues(keyBytes)
      const apiKey = 'jl_' + Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Hash the key for storage
      const encoder = new TextEncoder()
      const data = encoder.encode(apiKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Store the key
      const { data: newKey, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_preview: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
        })
        .select()
        .single()

      if (error) throw error

      // Show the full key once
      setNewApiKey(apiKey)
      setApiKeys([newKey, ...apiKeys])
      setNewKeyName('')
      toast.success('API key created successfully')
    } catch (error) {
      toast.error('Failed to create API key')
      console.error('Error creating API key:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteApiKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      setApiKeys(apiKeys.filter(key => key.id !== id))
      toast.success('API key deleted')
    } catch (error) {
      toast.error('Failed to delete API key')
      console.error('Error deleting API key:', error)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (!user) return null

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-600">
            Manage API keys for accessing Journey Log from your AI tools and integrations.
          </p>
        </div>

        {/* New API Key Display */}
        {newApiKey && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">
                  Your new API key has been created!
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  Make sure to copy it now. You won't be able to see it again.
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-white border border-green-300 rounded text-sm font-mono break-all">
                    {newApiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newApiKey)}
                    className="p-2 text-green-700 hover:bg-green-100 rounded transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewApiKey(null)}
                className="ml-4 text-green-700 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Create New Key */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Create New API Key</h2>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., MCP Server, VS Code)"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
            <button
              onClick={createApiKey}
              disabled={creating || !newKeyName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Key</span>
            </button>
          </div>
        </div>

        {/* API Keys List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your API Keys</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading API keys...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <Key className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No API keys yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold">{key.name}</h3>
                        <code className="text-sm text-gray-500 font-mono">
                          {key.key_preview}
                        </code>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && (
                          <span>
                            {' • '}Last used {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete API key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MCP Installation Guide */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-3">Quick Setup Guide</h2>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              To use Journey Log with your AI tools:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Create an API key above</li>
              <li>Install the MCP server: <code className="bg-white px-2 py-1 rounded">npm install -g @journey-log/mcp-server</code></li>
              <li>Configure your AI tool with the API key</li>
              <li>Start documenting your journey!</li>
            </ol>
            <p className="mt-3">
              <a
                href="https://github.com/journey-log/mcp-server"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View full installation guide →
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}