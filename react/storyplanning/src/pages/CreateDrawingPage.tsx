// File: CreateDrawingPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: A form page to create a drawing for one idea and potentially link it to a scene and character

import { useCallback, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Excalidraw, exportToCanvas } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { createDrawing } from "../api";

type FromState = { from?: string };
type SceneSnapshot = { elements: unknown; appState: unknown; files: unknown };

function serializeScene(snapshot: SceneSnapshot): string {
  // stable string signature used to skip redundant React state updates from Excalidraw onChange
  return JSON.stringify(snapshot);
}

function normalizeSceneData(scene: Record<string, unknown>): Record<string, unknown> {
  // guarantees Excalidraw-safe JSON for storage in the database by normalizing known shape-sensitive appState fields

  const rawAppState = scene.appState;
  const appState =
    rawAppState && typeof rawAppState === "object" ? { ...(rawAppState as Record<string, unknown>) } : {};
  const collaborators = (appState as { collaborators?: unknown }).collaborators;
  (appState as { collaborators: unknown[] }).collaborators = Array.isArray(collaborators) ? collaborators : [];

  return {
    elements: Array.isArray(scene.elements) ? scene.elements : [],
    appState,
    files: scene.files && typeof scene.files === "object" ? scene.files : {},
  };
}

function CreateDrawingPage() {
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

  const [title, setTitle] = useState(""); // optional title used in lists
  const [sceneData, setSceneData] = useState<Record<string, unknown>>({}); // latest drawing scene data from Excalidraw onChange
  const [busy, setBusy] = useState(false); // save request status
  const [error, setError] = useState(""); // user-facing error text
  const sceneSignatureRef = useRef<string>(""); // tracks last known scene data signature to prevent update loops

  const cancelTarget = from ?? (Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`);

  async function buildThumbnailDataUrl(): Promise<string> {
    // creates a PNG preview image from the current Excalidraw scene to be used as a thumbnail for the drawing
    const drawing = normalizeSceneData(sceneData) as {
      elements?: unknown[];
      appState?: Record<string, unknown>;
      files?: Record<string, unknown>;
    };
    const canvas = await exportToCanvas({
      elements: drawing.elements ?? [],
      appState: drawing.appState ?? {},
      files: drawing.files ?? {},
      getDimensions: () => ({ width: 360, height: 200, scale: 1 }),
    });
    return canvas.toDataURL("image/png");
  }

  async function handleCreateDrawing() {
    // creates a new drawing from the current canvas state and then opens drawing detail page
    setError("");
    if (Number.isNaN(ideaId)) {
      setError("Invalid idea id for drawing.");
      return;
    }
    setBusy(true);
    try {
      const normalizedSceneData = normalizeSceneData(sceneData);
      const thumbnailDataUrl = await buildThumbnailDataUrl();
      const created = await createDrawing(ideaId, {
        title: title.trim(),
        scene_data: normalizedSceneData,
        thumbnail_data_url: thumbnailDataUrl,
        scene: Number.isNaN(sceneId) ? null : sceneId,
        character: Number.isNaN(characterId) ? null : characterId,
      });
      const parentTarget =
        created.character != null
          ? `/characters/${created.character}`
          : created.scene != null
            ? `/scenes/${created.scene}`
            : `/ideas/${created.idea}`;
      navigate(`/drawings/${created.id}`, {
        state: { from: parentTarget },
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create drawing");
    } finally {
      setBusy(false);
    }
  }

  const handleSceneChange = useCallback((elements: unknown, appState: unknown, files: unknown) => {
    // Excalidraw can emit high-frequency changes so we only store when actual scene content changed so we don't update the state unnecessarily

    const nextSnapshot: SceneSnapshot = { elements, appState, files };
    const nextSignature = serializeScene(nextSnapshot);
    if (nextSignature === sceneSignatureRef.current) return;
    sceneSignatureRef.current = nextSignature;
    setSceneData(nextSnapshot as Record<string, unknown>);
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "1rem auto", padding: "0 1rem" }}>
      <p>
        <Link to={cancelTarget}>&larr; Cancel and Go Back</Link>
      </p>
      <h1>Create drawing</h1>
      <p>Draw freely, add an optional title, then click Create to save it.</p>

      <label htmlFor="drawing-title">Title (optional)</label>
      <input
        id="drawing-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Scene moodboard"
        style={{ display: "block", width: "100%", marginBottom: 12 }}
      />

      {/* Excalidraw canvas for creating a brand new drawing */}
      <div style={{ height: "70vh", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <Excalidraw
          onChange={handleSceneChange} // handle the scene changes from Excalidraw
        />
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={() => void handleCreateDrawing()} disabled={busy}>
          {busy ? "Creating..." : "Create"}
        </button>
        <button type="button" onClick={() => navigate(cancelTarget)} disabled={busy}>
          Cancel
        </button>
      </div>
    </main>
  );
}

export default CreateDrawingPage;
