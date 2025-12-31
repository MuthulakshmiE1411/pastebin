import { useState } from "react";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [views, setViews] = useState("");
  const [result, setResult] = useState(null);

  const createPaste = async () => {
    const response = await fetch("http://localhost:4000/api/pastes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
        ttl_seconds: ttl ? Number(ttl) : undefined,
        max_views: views ? Number(views) : undefined
      })
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="container">
      <h1>Pastebin Lite</h1>

      <div className="input-group">
        <textarea
          placeholder=" "
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <label>Enter your text here...</label>
      </div>

      <div className="input-group">
        <input
          type="number"
          placeholder=" "
          value={ttl}
          onChange={(e) => setTtl(e.target.value)}
        />
        <label>TTL in seconds (optional)</label>
      </div>

      <div className="input-group">
        <input
          type="number"
          placeholder=" "
          value={views}
          onChange={(e) => setViews(e.target.value)}
        />
        <label>Max views (optional)</label>
      </div>

      <button onClick={createPaste}>Create Paste</button>

      {result?.url && (
        <div className="result">
          <p>Paste Created ✅</p>
          <a href={result.url} target="_blank" rel="noreferrer">
            {result.url}
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
