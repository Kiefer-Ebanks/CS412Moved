// File: SceneDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: This page displays the details of a single scene, including title, outline, script, characters, and images

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  clearToken,
  getScene,
  resolveImageSrcForDisplay,
  updateSceneContent,
  updateSceneTitle,
  type SceneDetailResponse,
} from "../api";

type FromState = {
  from?: string;
};

function SceneDetailPage() {

  // Get the scene id from the URL and setup navigation
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // get the current page location
  const backTo = (location.state as FromState | null)?.from; // e.g. return to image detail when opened from there

  // State for the scene detail response and error text
  const [scene, setScene] = useState<SceneDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [editingTitle, setEditingTitle] = useState(false); // inline edit mode for scene title
  const [titleDraft, setTitleDraft] = useState(""); // the current draft text of the scene title input field before it is saved
  const [titleBusy, setTitleBusy] = useState(false); // state for the scene title update request status
  const [outlineDraft, setOutlineDraft] = useState(""); // always-editable outline text
  const [scriptDraft, setScriptDraft] = useState(""); // always-editable script text
  const [outlineBusy, setOutlineBusy] = useState(false); // state for the scene outline update request status
  const [scriptBusy, setScriptBusy] = useState(false); // state for the scene script update request status
  const [outlineMessage, setOutlineMessage] = useState(""); // short success text after outline save
  const [scriptMessage, setScriptMessage] = useState(""); // short success text after script save

  useEffect(() => {
    const pk = id ? Number.parseInt(id, 10) : NaN; // get the scene id from the route
    if (Number.isNaN(pk)) {
      setError("Invalid scene id");
      return;
    }

    async function loadScene() {
      try {
        const data = await getScene(pk); // load the scene from the API endpoint
        setScene(data);
        setOutlineDraft(data.outline ?? ""); // initialize editor with current outline text from the backend
        setScriptDraft(data.script ?? ""); // initialize editor with current script text from the backend
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load the scene";
        setError(message);
      }
    }

    loadScene();
  }, [id]);

  function handleLogout() {
    clearToken();
    navigate("/login"); // navigate to the login page
  }

  function startTitleEdit() {
    if (!scene) return;
    setEditingTitle(true);
    setTitleDraft(scene.title);
    setError("");
  }

  async function saveTitle() {
    if (!scene) return;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setError("Scene title cannot be blank.");
      return;
    }
    if (trimmed === scene.title.trim()) {
      setEditingTitle(false);
      return;
    }
    setTitleBusy(true);
    try {
      const updated = await updateSceneTitle(scene.id, trimmed);
      setScene({ ...scene, title: updated.title, timestamp: updated.timestamp });
      setEditingTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update scene title");
    } finally {
      setTitleBusy(false);
    }
  }

  async function handleSaveOutline() {
    // saves the outline from the inline edit to the server and update the local list of scenes

    if (!scene) return;
    setOutlineMessage(""); // clear any previous success messages
    setOutlineBusy(true); // set the outline busy state to true
    try {
      const updated = await updateSceneContent(scene.id, { outline: outlineDraft }); // update the outline on the server
      setScene({ ...scene, outline: updated.outline, timestamp: updated.timestamp }); // updating the outline and timestamp so "Last updated" refreshes immediately
      setOutlineMessage("Outline saved"); // set the success message to "Outline saved"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update outline");
    } finally {
      setOutlineBusy(false);
    }
  }

  async function handleSaveScript() {
    // saves the script from the inline edit to the server and update the local list of scenes
    
    if (!scene) return;
    setScriptMessage(""); // clear any previous success messages
    setScriptBusy(true); // set the script busy state to true
    try {
      const updated = await updateSceneContent(scene.id, { script: scriptDraft }); // update the script on the server
      setScene({ ...scene, script: updated.script, timestamp: updated.timestamp }); // updating the script and timestamp so "Last updated" refreshes immediately
      setScriptMessage("Script saved"); // set the success message to "Script saved"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update script");
    } finally {
      setScriptBusy(false);
    }
  }

  // show "Unsaved changes" when editor text differs from the saved outline/script on the scene object
  const outlineDirty = scene ? outlineDraft !== (scene.outline ?? "") : false;
  const scriptDirty = scene ? scriptDraft !== (scene.script ?? "") : false;

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        {backTo ? (
          <>
            {/* opened from another screen (e.g. image detail); jump back without losing scroll/history expectations */}
            <Link to={backTo}>&larr; Back</Link>
            {" · "}
          </>
        ) : null}
        {/* since scenes belong to ideas, this sends users back to ideas list quickly */}
        <Link to="/ideas">&larr; Back to ideas</Link>
      </p>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>

      {error ? (
        <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>
      ) : null}

      {!scene && !error ? <p>Loading...</p> : null}

      {scene ? (
        <>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              disabled={titleBusy}
              onBlur={() => void saveTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveTitle();
                } else if (e.key === "Escape") {
                  setEditingTitle(false);
                  setTitleDraft(scene.title);
                }
              }}
              style={{ fontSize: "1.8rem", fontWeight: 700, width: "100%", margin: "0 0 10px" }}
            />
          ) : (
            <h1 title="Double-click to rename" onDoubleClick={startTitleEdit} style={{ cursor: "text" }}>
              {scene.title}
            </h1>
          )}
          <p>
            <strong>Last updated:</strong> {scene.timestamp}
          </p>

          <section style={{ marginTop: 24 }}>
            <h2>Outline</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Edit freely. Changes save only when you press Save changes.
            </p>
            <div style={{ height: 280, border: "1px solid #ddd", borderRadius: 6, overflow: "auto" }}>
              <textarea
                value={outlineDraft}
                onChange={(e) => setOutlineDraft(e.target.value)}
                placeholder="Write scene outline..."
                style={{
                  width: "100%",
                  minHeight: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  padding: 12,
                  font: "inherit",
                  lineHeight: 1.45,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
              {outlineDirty ? <span style={{ color: "#990000" }}>Unsaved changes</span> : null}
              <button type="button" onClick={() => void handleSaveOutline()} disabled={outlineBusy}>
                {outlineBusy ? "Saving..." : "Save changes"}
              </button>
              {outlineMessage ? <span style={{ color: "green" }}>{outlineMessage}</span> : null}
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Script</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Edit freely. Changes save only when you press Save changes.
            </p>
            <div style={{ height: 280, border: "1px solid #ddd", borderRadius: 6, overflow: "auto" }}>
              <textarea
                value={scriptDraft}
                onChange={(e) => setScriptDraft(e.target.value)}
                placeholder="Write scene script..."
                style={{
                  width: "100%",
                  minHeight: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  padding: 12,
                  font: "inherit",
                  lineHeight: 1.45,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
              {scriptDirty ? <span style={{ color: "#990000" }}>Unsaved changes</span> : null}
              <button type="button" onClick={() => void handleSaveScript()} disabled={scriptBusy}>
                {scriptBusy ? "Saving..." : "Save changes"}
              </button>
              {scriptMessage ? <span style={{ color: "green" }}>{scriptMessage}</span> : null}
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Characters in this scene</h2>
            {scene.characters.length > 0 ? (
              <ul>
                {scene.characters.map((character) => (
                  <li key={character.id}>
                    <Link
                      // clicking the character name takes the user to the character detail page
                      to={`/characters/${character.id}`}
                      // save the current page location in the state so the user can be redirected back to it after going to the character detail page
                      state={{ from: `${location.pathname}${location.search}` }}
                    >
                      <strong>{character.name}</strong>
                    </Link>
                    {character.description ? (
                      <p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>
                        {character.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No characters linked to this scene yet</p>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Images in this scene</h2>
            {scene.images.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {scene.images.map((image) => (
                  <li key={image.id} style={{ marginBottom: 16 }}>
                    <Link
                      to={`/images/${image.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {image.image ? (
                        <>
                          {/* convert media paths to full URLs so uploaded files load in React */}
                          <img
                            src={resolveImageSrcForDisplay(image.image) ?? ""}
                            alt={image.description ?? "scene image"}
                            style={{ maxWidth: "100%", maxHeight: 240, display: "block" }}
                          />
                        </>
                      ) : null}
                      <p>{image.description || "(no description)"}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No images linked to this scene yet</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default SceneDetailPage; // export the SceneDetailPage component
