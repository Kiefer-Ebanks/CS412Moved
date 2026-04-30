// File: CreateImageUploadPage.tsx
// Description: Form page to upload an image file and optional description, then redirect to that image detail page.

import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createImageUpload } from "../api";

type FromState = { from?: string };

function CreateImageUploadPage() {
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

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelTarget = from ?? (Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // uploads one file and optional metadata, then routes to the newly created image detail page
    event.preventDefault();
    setError("");
    if (Number.isNaN(ideaId)) {
      setError("Invalid idea id for image upload.");
      return;
    }
    if (!file) {
      setError("Select a photo to upload.");
      return;
    }
    setBusy(true);
    try {
      const created = await createImageUpload(ideaId, {
        file,
        description,
        scene: Number.isNaN(sceneId) ? null : sceneId,
        character: Number.isNaN(characterId) ? null : characterId,
      });
      navigate(`/images/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to={cancelTarget}>&larr; Cancel and return</Link>
      </p>

      <h1>Upload a photo</h1>
      <p>Select an image file and optional description.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="image-file">Photo</label>
        <input
          id="image-file"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
            {busy ? "Uploading..." : "Create"}
          </button>
          <button type="button" onClick={() => navigate(cancelTarget)} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateImageUploadPage;
