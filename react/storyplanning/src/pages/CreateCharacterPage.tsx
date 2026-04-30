// File: CreateCharacterPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: A form page to create a character for one idea and maybe tie it to a specific scene

import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createCharacter } from "../api";

type FromState = { from?: string };

function CreateCharacterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;
  const [searchParams] = useSearchParams();
  const sceneIdParam = searchParams.get("sceneId");
  const sceneId = sceneIdParam ? Number.parseInt(sceneIdParam, 10) : NaN;
  const { id: ideaIdParam } = useParams<{ id: string }>();
  const ideaId = ideaIdParam ? Number.parseInt(ideaIdParam, 10) : NaN;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelTarget = from ?? (Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (Number.isNaN(ideaId)) {
      setError("Invalid idea id for new character.");
      return;
    }
    if (!trimmedName) {
      setError("Character name is required.");
      return;
    }
    setBusy(true);
    try {
      const created = await createCharacter(ideaId, {
        name: trimmedName,
        description,
        // only send scene when valid since the user may not have created the character from the scene detail page
        scene: Number.isNaN(sceneId) ? null : sceneId,
      });
      // after creating a character, Back should go back to a scene, but if there isn't one it will go back to the idea
      const parentTarget = created.scene != null ? `/scenes/${created.scene}` : `/ideas/${created.idea}`;
      navigate(`/characters/${created.id}`, {
        state: { from: parentTarget },
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create character");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to={cancelTarget}>&larr; Cancel and return</Link>
      </p>

      <h1>Create character</h1>
      <p>Name is required. Description is optional.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="character-name">Name</label>
        <input
          id="character-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="character-description">Description (optional)</label>
        <textarea
          id="character-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
          <button type="button" onClick={() => navigate(cancelTarget)} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateCharacterPage;
