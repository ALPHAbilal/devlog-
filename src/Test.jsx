import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function Test() {
  const [status, setStatus] = useState('Checking...');
  
  useEffect(() => {
    async function checkSupabase() {
      try {
        // Check if Supabase client exists
        if (!supabase) {
          setStatus('Supabase client not initialized');
          return;
        }
        
        // Try to get session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus(`Error: ${error.message}`);
        } else if (data.session) {
          setStatus(`Logged in as: ${data.session.user.email}`);
        } else {
          setStatus('Not logged in');
        }
      } catch (err) {
        setStatus(`Exception: ${err.message}`);
      }
    }
    
    checkSupabase();
  }, []);
  
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl text-gray-200 mb-4">Supabase Connection Test</h1>
        <p className="text-gray-400">{status}</p>
      </div>
    </div>
  );
}