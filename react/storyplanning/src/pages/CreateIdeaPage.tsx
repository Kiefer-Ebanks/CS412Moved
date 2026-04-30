// File: CreateIdeaPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: form page for creating a new idea.
// When the user submits the form it redirects them to that idea's detail page, and the cancel button returns them to the all ideas page

import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createIdea } from "../api";

function CreateIdeaPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [storyboard, setStoryboard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // prevent full page reload so we can handle submit in React
    setError("");
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    setBusy(true);
    try {
      const created = await createIdea(trimmedTitle, storyboard);
      // after create, jump directly to the detail page for this brand-new idea
      navigate(`/ideas/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create idea");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 1rem",
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
      }}>
      <div style={{ width: "100%" }}>
      <h1>Create idea</h1>
      <p style={{ marginBottom: 18 }}>Enter your idea's title and a short storyboard</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="idea-title">Title (required)</label>
        <input
          id="idea-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="idea-storyboard">Storyboard</label>
        <textarea
          id="idea-storyboard"
          value={storyboard}
          onChange={(e) => setStoryboard(e.target.value)}
          rows={8}
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
          <button type="button" onClick={() => navigate("/ideas")} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
      </div>
    </main>
  );
}

export default CreateIdeaPage; // export the CreateIdeaPage component so it can be used in other files
