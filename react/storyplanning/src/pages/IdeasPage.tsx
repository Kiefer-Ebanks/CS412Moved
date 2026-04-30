// File: IdeasPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This page displays the list of ideas for the user
// It also allows the user to logout and navigate back to the login page

import { useEffect, useState } from "react";
import { clearToken, getIdeas, updateIdeaTitle, type IdeasListResponse } from "../api";
import { Link, useNavigate } from "react-router-dom";

function IdeasPage() {

  const navigate = useNavigate(); // using the useNavigate hook to navigate to the login page
  const [ideas, setIdeas] = useState<IdeasListResponse | null>(null); // state to store the ideas
  const [error, setError] = useState(""); // state to store any errors
  const [editingIdeaId, setEditingIdeaId] = useState<number | null>(null); // which idea title is in inline-edit mode
  const [editingTitle, setEditingTitle] = useState(""); // current text in inline title input
  const [titleBusyId, setTitleBusyId] = useState<number | null>(null); // keep only one title-save in progress at a time

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

  function startInlineEdit(id: number, currentTitle: string) {
    // enter edit mode when user double-clicks a title

    setEditingIdeaId(id); // set the editing idea id to the id of the idea that the user double-clicked
    setEditingTitle(currentTitle); // set the editing title to the current title of the idea that the user double-clicked
    setError(""); // clear any previous errors
  }

  async function saveInlineTitle(id: number, originalTitle: string) {
    if (!ideas) return;
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setError("Title cannot be blank.");
      return;
    }
    if (trimmed === originalTitle.trim()) {
      setEditingIdeaId(null);
      setEditingTitle("");
      return;
    }
    setTitleBusyId(id);
    try {
      const updated = await updateIdeaTitle(id, trimmed);
      // update the local list of ideas with the new title after the server confirms the update
      setIdeas({
        ...ideas,
        results: ideas.results.map((row) => (row.id === id ? { ...row, title: updated.title } : row)),
      });
      setEditingIdeaId(null);
      setEditingTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update title");
    } finally {
      setTitleBusyId(null);
    }
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
          {/* separate create-idea row, formatted like other idea rows but not editable on double-click */}
          <li style={{ marginBottom: 12 }}>
            <strong>Create a new idea</strong>
            {"  "}
            <Link to="/ideas/new">&rarr;</Link> {/* link to the create idea page */}
          </li>

          {ideas.results.map((idea) => ( // map over the ideas and display them in a list
            <li key={idea.id} style={{ marginBottom: 12 }}>
              {editingIdeaId === idea.id ? ( // if the idea is being edited, display the input field
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  disabled={titleBusyId === idea.id}
                  onBlur={() => void saveInlineTitle(idea.id, idea.title)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveInlineTitle(idea.id, idea.title);
                    } else if (e.key === "Escape") {
                      // Escape exits edit mode without saving any changes
                      setEditingIdeaId(null);
                      setEditingTitle("");
                    }
                  }}
                  style={{ width: "100%", maxWidth: 420, marginBottom: 4 }}
                />
              ) : (
                <>
                  <strong
                    title="Double-click to rename"
                    onDoubleClick={() => startInlineEdit(idea.id, idea.title)}
                    style={{ cursor: "text" }}>
                    {idea.title}
                  </strong>
                  {"  "}
                  <Link to={`/ideas/${idea.id}`}>&rarr;</Link>
                </>
              )}
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
