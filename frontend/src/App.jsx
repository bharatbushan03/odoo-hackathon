import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const checkEndpoint = async (key, path) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}${path}`);
      const data = await res.json();
      setResults((prev) => ({ ...prev, [key]: data }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [key]: { status: 'error', message: err.message } }));
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '40px auto' }}>
      <h1>stack rehearsal</h1>
      <p>API target: <code>{API_URL}</code></p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => checkEndpoint('health', '/api/health')}>check server</button>
        <button onClick={() => checkEndpoint('db', '/api/db-check')}>check postgres</button>
        <button onClick={() => checkEndpoint('hello', '/api/hello')}>write + read row</button>
      </div>

      {loading && <p>loading...</p>}

      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}

export default App;
