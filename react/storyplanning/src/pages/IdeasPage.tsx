// File: IdeasPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This page displays the list of ideas for the user
// It also allows the user to logout and navigate back to the login page

import { useEffect, useState } from "react";
import { getIdeas, updateIdeaTitle, type IdeasListResponse } from "../api";
import { Link } from "react-router-dom";

function IdeasPage() {
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
    <main style={{ maxWidth: 880, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>Your ideas</h1>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {!ideas && !error ? <p>Loading...</p> : null}

      <section
        style={{
          margin: "0 auto",
          maxWidth: 760,
          border: "1px solid var(--border)",
          borderRadius: 18,
          overflow: "hidden",
          background: "var(--surface)",
          boxShadow: "0 12px 28px rgba(20, 20, 30, 0.12), 0 2px 6px rgba(20, 20, 30, 0.08)",
        }}>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            maxHeight: "60vh",
            overflowY: "auto",
          }}>
          {/* create-idea row is first row inside the ideas box */}
          <li
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.95rem 1rem",
              borderBottom: "1px solid var(--border)",
            }}>
            <strong>Create a new idea</strong>
            <Link to="/ideas/new" style={{ textDecoration: "none", fontSize: "1.3rem", lineHeight: 1 }}>
              &rarr;
            </Link>
          </li>

          {ideas?.results.map((idea) => (
            <li
              key={idea.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.8rem",
                padding: "0.95rem 1rem",
                borderBottom: "1px solid var(--border)",
              }}>
              {editingIdeaId === idea.id ? (
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
                  style={{ flex: 1, minWidth: 0 }}
                />
              ) : (
                <strong
                  title="Double-click to rename"
                  onDoubleClick={() => startInlineEdit(idea.id, idea.title)}
                  style={{ cursor: "text", flex: 1, minWidth: 0 }}>
                  {idea.title}
                </strong>
              )}
              <Link to={`/ideas/${idea.id}`} style={{ textDecoration: "none", fontSize: "1.3rem", lineHeight: 1 }}>
                &rarr;
              </Link>
            </li>
          ))}

          {ideas && ideas.results.length === 0 ? (
            <li style={{ padding: "0.95rem 1rem", color: "var(--text-muted)" }}>No ideas yet</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}

export default IdeasPage;
