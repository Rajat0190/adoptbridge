import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('profiles').select('*')
      if (!error) {
        setConnected(true)
      }
    }
    testConnection()
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>AdoptBridge 🌉</h1>
      {connected 
        ? <p style={{ color: 'green' }}>✅ Database Connected!</p>
        : <p style={{ color: 'orange' }}>Connecting to database...</p>
      }
    </div>
  )
}

export default App