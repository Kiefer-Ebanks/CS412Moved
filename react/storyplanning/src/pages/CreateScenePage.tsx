// File: CreateScenePage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: A form page to create a new scene for one idea
// Submitting it redirects to scene detail page for the new scene just created, cancelling returns the user to the idea detail page

import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createScene } from "../api";

function CreateScenePage() {
  const navigate = useNavigate(); // use the navigate function to redirect the user to the scene detail page
  const { id: ideaIdParam } = useParams<{ id: string }>();
  const ideaId = ideaIdParam ? Number.parseInt(ideaIdParam, 10) : NaN; // convert the idea id from the URL to a number

  const [title, setTitle] = useState(""); // state for the scene title
  const [outline, setOutline] = useState(""); // state for the scene outline
  const [script, setScript] = useState(""); // state for the scene script
  const [busy, setBusy] = useState(false); // state for the busy state of the create scene request
  const [error, setError] = useState(""); // state for the error message

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedTitle = title.trim();
    if (Number.isNaN(ideaId)) {
      setError("Invalid idea id for new scene.");
      return;
    }
    if (!trimmedTitle) {
      setError("Scene title is required.");
      return;
    }
    setBusy(true);
    try {
      const created = await createScene(ideaId, {
        title: trimmedTitle,
        outline,
        script,
      });
      // after creating a scene, set Back target to its parent idea and not the create form page
      navigate(`/scenes/${created.id}`, {
        state: { from: `/ideas/${ideaId}` },
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create scene");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to={Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`}>&larr; Cancel and return to idea</Link>
      </p>

      <h1>Create scene</h1>
      <p>Title is required. Outline and script are optional.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="scene-title">Title</label>
        <input
          id="scene-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="scene-outline">Outline (optional)</label>
        <textarea
          id="scene-outline"
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          rows={7}
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="scene-script">Script (optional)</label>
        <textarea
          id="scene-script"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={9}
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => navigate(Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`)}
            disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateScenePage;
