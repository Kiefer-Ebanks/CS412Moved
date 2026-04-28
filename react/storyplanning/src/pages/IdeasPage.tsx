import { useEffect, useState } from "react";
import { clearToken, getIdeas } from "../api";
import { useNavigate } from "react-router-dom";

function IdeasPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadIdeas() {
      try {
        const data = await getIdeas();
        setIdeas(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load ideas";
        setError(message);
      }
    }

    loadIdeas();
  }, []);

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Ideas</h1>
      <p>Token auth works if this page can load data.</p>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>
        {ideas ? JSON.stringify(ideas, null, 2) : "Loading..."}
      </pre>
    </main>
  );
}

export default IdeasPage;
