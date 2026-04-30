// File: CreateImageLinkPage.tsx
// Description: Form page to create an image from an external URL and optional description, then redirect to image detail.

import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createImageLink } from "../api";

type FromState = { from?: string };

function CreateImageLinkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;
  const [searchParams] = useSearchParams();
  const sceneIdParam = searchParams.get("sceneId");
  const characterIdParam = searchParams.get("characterId");
  const sceneId = sceneIdParam ? Number.parseInt(sceneIdParam, 10) : NaN;
  const characterId = characterIdParam ? Number.parseInt(characterIdParam, 10) : NaN;
  const { id: ideaIdParam } = useParams<{ id: string }>();
  const ideaId = ideaIdParam ? Number.parseInt(ideaIdParam, 10) : NaN;

  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelTarget = from ?? (Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // posts URL-based image data and routes to the newly created image detail page
    event.preventDefault();
    setError("");
    const trimmedUrl = imageUrl.trim();
    if (Number.isNaN(ideaId)) {
      setError("Invalid idea id for image link.");
      return;
    }
    if (!trimmedUrl) {
      setError("Image URL is required.");
      return;
    }
    setBusy(true);
    try {
      const created = await createImageLink(ideaId, {
        image_url: trimmedUrl,
        description,
        scene: Number.isNaN(sceneId) ? null : sceneId,
        character: Number.isNaN(characterId) ? null : characterId,
      });
      navigate(`/images/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add image link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to={cancelTarget}>&larr; Cancel and return</Link>
      </p>

      <h1>Add a link</h1>
      <p>Paste an image URL and optional description.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="image-url">Image URL</label>
        <input
          id="image-url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="image-description">Description (optional)</label>
        <textarea
          id="image-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
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

export default CreateImageLinkPage;
