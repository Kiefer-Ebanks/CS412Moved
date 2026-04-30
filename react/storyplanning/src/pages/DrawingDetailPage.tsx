// File: DrawingDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: Excalidraw editor page for one saved drawing with save and delete functionality

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Excalidraw, exportToCanvas } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { deleteDrawing, getDrawing, type DrawingDetailResponse, updateDrawing } from "../api";

type FromState = { from?: string };

function normalizeSceneData(scene: Record<string, unknown>): Record<string, unknown> {
  // guarantees Excalidraw-safe JSON for persistence and initialData by normalizing appState fields
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

function buildSceneSignature(scene: Record<string, unknown>): string {
  // compares only stable drawing content so volatile Excalidraw runtime fields do not trigger dirty state comparison

  const normalized = normalizeSceneData(scene); // normalize the scene data to ensure it is Excalidraw-safe
  const appState = (normalized.appState ?? {}) as Record<string, unknown>;
  return JSON.stringify({ // return a JSON string of the normalized scene data
    elements: normalized.elements ?? [], // elements are the drawing elements
    files: normalized.files ?? {}, // files are the drawing files
    viewBackgroundColor: appState.viewBackgroundColor ?? null, // viewBackgroundColor is the background color of the drawing
  });
}

function DrawingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;
  const returnTo = `${location.pathname}${location.search}`;

  const [drawing, setDrawing] = useState<DrawingDetailResponse | null>(null); // saved drawing response from backend
  const [titleDraft, setTitleDraft] = useState(""); // editable title draft
  const [editorInitialData, setEditorInitialData] = useState<Record<string, unknown> | null>(null); // one-time initial scene payload used to load Excalidraw safely
  const [sceneDirty, setSceneDirty] = useState(false); // tracks whether canvas content changed since last save or load
  const [busy, setBusy] = useState(false); // save request state
  const [deleteBusy, setDeleteBusy] = useState(false); // delete request state
  const [message, setMessage] = useState(""); // success text after save
  const [error, setError] = useState(""); // error text
  const sceneSignatureRef = useRef<string>(""); // tracks current stable scene signature to avoid redundant updates
  const savedSceneSignatureRef = useRef<string>(""); // tracks last persisted scene signature for dirty-state comparison
  const sceneDataRef = useRef<Record<string, unknown>>({}); // stores latest canvas scene without forcing rerenders
  const saveMessageTimerRef = useRef<number | null>(null); // auto-clears success text after a short delay

  useEffect(() => {
    // loads one drawing by route id and updates the editor draft state
    const pk = id ? Number.parseInt(id, 10) : NaN;
    if (Number.isNaN(pk)) {
      setError("Invalid drawing id");
      return;
    }

    async function loadDrawing() {
      // load the drawing by id and update the editor draft state
      try {
        const data = await getDrawing(pk);
        setDrawing(data);
        setTitleDraft(data.title ?? "");
        const initialScene = normalizeSceneData((data.scene_data ?? {}) as Record<string, unknown>);

        setEditorInitialData(initialScene);
        sceneDataRef.current = initialScene;
        setSceneDirty(false);
        const initialSignature = buildSceneSignature(initialScene);
        sceneSignatureRef.current = initialSignature;
        savedSceneSignatureRef.current = initialSignature;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load drawing");
      }
    }

    void loadDrawing();
  }, [id]);

  function formatTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function buildThumbnailDataUrl(): Promise<string> {
    // generate a compact png preview from current canvas for drawing list thumbnails

    const scene = normalizeSceneData(sceneDataRef.current) as {
      elements?: unknown[];
      appState?: Record<string, unknown>;
      files?: Record<string, unknown>;
    };
    const canvas = await exportToCanvas({
      elements: scene.elements ?? [],
      appState: scene.appState ?? {},
      files: scene.files ?? {},
      getDimensions: () => ({ width: 360, height: 200, scale: 1 }),
    });
    return canvas.toDataURL("image/png");
  }

  async function handleSaveDrawing() {
    // saves current title and scene JSON so users can reopen and continue editing later

    if (!drawing || busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const normalizedSceneData = normalizeSceneData(sceneDataRef.current);
      const thumbnailDataUrl = await buildThumbnailDataUrl();
      const updated = await updateDrawing(drawing.id, {
        title: titleDraft.trim(),
        scene_data: normalizedSceneData,
        thumbnail_data_url: thumbnailDataUrl,
      });
      setDrawing(updated);
      setTitleDraft(updated.title ?? "");
      const savedScene = normalizeSceneData((updated.scene_data ?? {}) as Record<string, unknown>);
      sceneDataRef.current = savedScene;
      const savedSignature = buildSceneSignature(savedScene);
      sceneSignatureRef.current = savedSignature;
      savedSceneSignatureRef.current = savedSignature;
      setSceneDirty(false);
      setMessage("Drawing saved");
      if (saveMessageTimerRef.current != null) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
      saveMessageTimerRef.current = window.setTimeout(() => {
        setMessage("");
        saveMessageTimerRef.current = null;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save drawing");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDrawing() {
    // deletes this drawing row after confirmation and routes to parent context page
    if (!drawing || deleteBusy) return;
    if (!window.confirm("Delete this drawing? This cannot be undone.")) {
      return;
    }
    setDeleteBusy(true);
    setError("");
    try {
      await deleteDrawing(drawing.id);
      if (from) {
        navigate(from, { replace: true });
      } else if (drawing.character != null) {
        navigate(`/characters/${drawing.character}`, { replace: true });
      } else if (drawing.scene != null) {
        navigate(`/scenes/${drawing.scene}`, { replace: true });
      } else {
        navigate(`/ideas/${drawing.idea}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete drawing");
      setDeleteBusy(false);
    }
  }

  const handleSceneChange = useCallback((elements: unknown, appState: unknown, files: unknown) => {
    // stores canvas changes in refs so Excalidraw edits do not cause render-feedback loops saying unsaved changes when none were made

    const nextSnapshot = normalizeSceneData({ elements, appState, files });
    const nextSignature = buildSceneSignature(nextSnapshot);
    if (nextSignature === sceneSignatureRef.current) return;
    sceneSignatureRef.current = nextSignature;
    sceneDataRef.current = nextSnapshot;
    setSceneDirty(nextSignature !== savedSceneSignatureRef.current);
  }, []);
  const titleDirty = drawing ? titleDraft.trim() !== (drawing.title ?? "").trim() : false;

  return (
    <main style={{ maxWidth: 1100, margin: "1rem auto", padding: "0 1rem" }}>
      {error ? <p style={{ color: "crimson", marginTop: 16 }}>{error}</p> : null}
      {!drawing && !error ? <p>Loading...</p> : null}

      {drawing ? (
        <>
          <h1>Drawing editor</h1>
          <p>
            <strong>Last updated:</strong> {formatTimestamp(drawing.timestamp)}
          </p>

          <label htmlFor="drawing-title">Title (optional)</label>
          <input
            id="drawing-title"
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="e.g. Scene moodboard"
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />

          {/* Excalidraw canvas initialized from saved scene JSON so users can continue editing */}
          <div style={{ height: "70vh", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            {editorInitialData ? <Excalidraw initialData={editorInitialData as any} onChange={handleSceneChange} /> : null} {/* any is used to avoid type errors because the initialData is not typed */}
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
            {message ? (
              <span style={{ color: "green" }}>{message}</span>
            ) : titleDirty || sceneDirty ? (
              <span style={{ color: "#990000" }}>Unsaved changes</span>
            ) : null}
            <button type="button" onClick={() => void handleSaveDrawing()} disabled={busy}>
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>

          <nav style={{ marginTop: 16, fontSize: "0.9rem", color: "#555" }} aria-label="Related records">
            <strong>Go to:</strong>{" "}
            <Link to={`/ideas/${drawing.idea}`} state={{ from: returnTo }}>
              {drawing.idea_title?.trim() ? drawing.idea_title : "Idea"}
            </Link>
            {drawing.scene != null ? (
              <>
                {" · "}
                <Link to={`/scenes/${drawing.scene}`} state={{ from: returnTo }}>
                  {drawing.scene_title?.trim() ? drawing.scene_title : "Scene"}
                </Link>
              </>
            ) : null}
            {drawing.character != null ? (
              <>
                {" · "}
                <Link to={`/characters/${drawing.character}`} state={{ from: returnTo }}>
                  {drawing.character_name?.trim() ? drawing.character_name : "Character"}
                </Link>
              </>
            ) : null}
          </nav>

          <section style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid #ddd" }}>
            <h2 style={{ color: "#8b0000", marginBottom: 10 }}>Delete drawing</h2>
            <p style={{ marginTop: 0, marginBottom: 18 }}>
              This removes the drawing permanently. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => void handleDeleteDrawing()}
              disabled={deleteBusy}
              style={{ marginTop: 4, background: "#c00", color: "#fff", border: "none", padding: "8px 14px" }}>
              {deleteBusy ? "Deleting..." : "Delete drawing"}
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default DrawingDetailPage;
