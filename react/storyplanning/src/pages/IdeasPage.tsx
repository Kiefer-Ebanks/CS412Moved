// File: IdeasPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This page displays the list of ideas for the user
// It also allows the user to logout and navigate back to the login page

import { useEffect, useState } from "react";
import { clearToken, getIdeas, type IdeasListResponse } from "../api";
import { Link, useNavigate } from "react-router-dom";

function IdeasPage() {

  const navigate = useNavigate(); // using the useNavigate hook to navigate to the login page
  const [ideas, setIdeas] = useState<IdeasListResponse | null>(null); // state to store the ideas
  const [error, setError] = useState(""); // state to store any errors

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
      <p style={{ marginBottom: 12 }}>
        <Link to="/account">Account settings</Link>
      </p>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {!ideas && !error ? <p>Loading...</p> : null}

      {ideas ? (
        <ul style={{ marginTop: 16, paddingLeft: 20 }}>
          {ideas.results.map((idea) => (
            <li key={idea.id} style={{ marginBottom: 12 }}>
              <Link to={`/ideas/${idea.id}`}>
                <strong>{idea.title}</strong>
              </Link>
              {idea.storyboard ? (
                <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                  {idea.storyboard.length > 160
                    ? `${idea.storyboard.slice(0, 160)}…`
                    : idea.storyboard}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {ideas && ideas.results.length === 0 ? (
        <p style={{ marginTop: 16 }}>No ideas yet</p>
      ) : null}
    </main>
  );
}

export default IdeasPage;
