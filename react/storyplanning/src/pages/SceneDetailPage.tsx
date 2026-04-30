// File: SceneDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: This page displays the details of a single scene, including title, outline, script, characters, and images

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  deleteScene,
  getScene,
  resolveImageSrcForDisplay,
  updateCharacterName,
  updateSceneContent,
  updateSceneTitle,
  type SceneDetailResponse,
} from "../api";

type SceneCharacterRow = SceneDetailResponse["characters"][number]; // shape of a character row from the scene detail response

function SceneDetailPage() {

  // Get the scene id from the URL and setup navigation
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // get the current page location

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
  const [deleteBusy, setDeleteBusy] = useState(false); // state for deleting this scene
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null); // state of the character row currently being renamed
  const [characterNameDraft, setCharacterNameDraft] = useState(""); // draft text for inline character rename
  const [characterNameBusyId, setCharacterNameBusyId] = useState<number | null>(null); // busy state for one character rename save
  const [showAddImageMenu, setShowAddImageMenu] = useState(false); // toggles the Add an image dropdown menu
  const characterClickTimerRef = useRef<number | null>(null); // single-click timer so double-click on name can still enter edit mode
  const outlineMessageTimerRef = useRef<number | null>(null); // auto-clears outline success text after a short delay
  const scriptMessageTimerRef = useRef<number | null>(null); // auto-clears script success text after a short delay

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

  useEffect(() => {
    // keep navbar back target pointing to this scene's parent idea detail page so we can click the back button to go back to the idea detail page

    if (!scene) return;
    const desiredFrom = `/ideas/${scene.idea}`;
    const currentFrom = (location.state as { from?: string } | null)?.from;
    if (currentFrom === desiredFrom) return;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: { from: desiredFrom },
    });
  }, [scene, location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    return () => {
      if (characterClickTimerRef.current != null) {
        window.clearTimeout(characterClickTimerRef.current);
      }
      if (outlineMessageTimerRef.current != null) {
        window.clearTimeout(outlineMessageTimerRef.current);
      }
      if (scriptMessageTimerRef.current != null) {
        window.clearTimeout(scriptMessageTimerRef.current);
      }
    };
  }, []);

  function formatTimestamp(value: string): string {
    // format API timestamp as Month Day, Year and hour:minute AM/PM for easier reading

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
      
      if (outlineMessageTimerRef.current != null) { // clear the timeout if it exists
        window.clearTimeout(outlineMessageTimerRef.current);
      }
      outlineMessageTimerRef.current = window.setTimeout(() => { // set a new timeout to clear the success message after a short delay
        setOutlineMessage("");
        outlineMessageTimerRef.current = null;
      }, 1500);
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
      
      if (scriptMessageTimerRef.current != null) { // clear the timeout if it exists
        window.clearTimeout(scriptMessageTimerRef.current);
      }
      scriptMessageTimerRef.current = window.setTimeout(() => { // set a new timeout to clear the success message after a short delay
        setScriptMessage("");
        scriptMessageTimerRef.current = null;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update script");
    } finally {
      setScriptBusy(false);
    }
  }

  async function handleDeleteScene() {
    // deletes the scene and the backend cascades the delete to remove all related images and characters

    if (!scene) return;

    // confirm the deletion with the user with a confirmation dialog box
    if (!window.confirm("Delete this scene and its related data? This cannot be undone.")) {
      return;
    }
    setDeleteBusy(true);
    try {
      const ideaId = scene.idea; // capture before delete so we can navigate to parent idea page
      await deleteScene(scene.id);
      navigate(`/ideas/${ideaId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete scene");
    } finally {
      setDeleteBusy(false);
    }
  }

  function startCharacterNameEdit(character: SceneCharacterRow) {
    // enter edit mode when user double-clicks a character name
    if (characterClickTimerRef.current != null) {
      window.clearTimeout(characterClickTimerRef.current);
      characterClickTimerRef.current = null;
    }
    setEditingCharacterId(character.id);
    setCharacterNameDraft(character.name);
    setError("");
  }

  function handleCharacterCardClick(characterId: number) {
    // single-click anywhere on card opens detail; slight delay lets name double-click enter edit mode
    if (editingCharacterId != null) return;
    if (characterClickTimerRef.current != null) {
      window.clearTimeout(characterClickTimerRef.current);
    }
    characterClickTimerRef.current = window.setTimeout(() => {
      navigate(`/characters/${characterId}`, {
        state: { from: `${location.pathname}${location.search}` },
      });
      characterClickTimerRef.current = null;
    }, 220);
  }

  async function saveCharacterName(character: SceneCharacterRow) {
    // saves the character name from the inline edit to the server and update the local list of characters
    if (!scene) return;
    const trimmed = characterNameDraft.trim();
    if (!trimmed) {
      setError("Character name cannot be blank.");
      return;
    }
    if (trimmed === character.name.trim()) {
      setEditingCharacterId(null);
      setCharacterNameDraft("");
      return;
    }
    setCharacterNameBusyId(character.id);
    try {
      const updated = await updateCharacterName(character.id, trimmed);
      setScene({
        ...scene,
        characters: scene.characters.map((row) =>
          row.id === character.id ? { ...row, name: updated.name } : row,
        ),
      });
      setEditingCharacterId(null);
      setCharacterNameDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update character name");
    } finally {
      setCharacterNameBusyId(null);
    }
  }

  // show "Unsaved changes" when editor text differs from the saved outline/script on the scene object
  const outlineDirty = scene ? outlineDraft !== (scene.outline ?? "") : false;
  const scriptDirty = scene ? scriptDraft !== (scene.script ?? "") : false;

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
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
            <strong>Last updated:</strong> {formatTimestamp(scene.timestamp)}
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
              {outlineMessage ? (
                <span style={{ color: "green" }}>{outlineMessage}</span>
              ) : outlineDirty ? (
                <span style={{ color: "#990000" }}>Unsaved changes</span>
              ) : null}
              <button type="button" onClick={() => void handleSaveOutline()} disabled={outlineBusy}>
                {outlineBusy ? "Saving..." : "Save changes"}
              </button>
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
              {scriptMessage ? (
                <span style={{ color: "green" }}>{scriptMessage}</span>
              ) : scriptDirty ? (
                <span style={{ color: "#990000" }}>Unsaved changes</span>
              ) : null}
              <button type="button" onClick={() => void handleSaveScript()} disabled={scriptBusy}>
                {scriptBusy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>

          <section style={{ marginTop: 34 }}>
            <h2>Characters in this scene</h2>
            <div style={{ padding: 10, maxHeight: 290, overflowY: "auto" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      background: "var(--surface)",
                      padding: "12px 14px",
                    }}>
                    <Link
                      to={`/ideas/${scene.idea}/characters/new?sceneId=${scene.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "inherit",
                        textDecoration: "none",
                      }}>
                      <strong>Create a new character</strong>
                      <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>&rarr;</span>
                    </Link>
                  </div>
                </li>

                {scene.characters.map((character) => (
                  <li key={character.id} style={{ marginBottom: 12 }}>
                    <div
                      onClick={() => handleCharacterCardClick(character.id)}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        background: "var(--surface)",
                        padding: "12px 14px",
                        cursor: "pointer",
                      }}>
                      {editingCharacterId === character.id ? (
                        <input
                          autoFocus
                          value={characterNameDraft}
                          onChange={(e) => setCharacterNameDraft(e.target.value)}
                          disabled={characterNameBusyId === character.id}
                          onBlur={() => void saveCharacterName(character)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void saveCharacterName(character);
                            } else if (e.key === "Escape") {
                              setEditingCharacterId(null);
                              setCharacterNameDraft("");
                            }
                          }}
                          style={{ width: "100%", marginBottom: 4 }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}>
                          <strong
                            title="Double-click to rename"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startCharacterNameEdit(character);
                            }}
                            style={{ cursor: "text" }}>
                            {character.name}
                          </strong>
                          <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>
                            &rarr;
                          </span>
                        </div>
                      )}
                      {character.description ? (
                        <p
                          style={{
                            margin: "6px 0 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                          {character.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {scene.characters.length === 0 ? (
              <p style={{ marginTop: 12 }}>No characters linked to this scene yet</p>
            ) : null}
          </section>

          <section style={{ marginTop: 48 }}>
            <h2>Images related to this scene</h2>
            <div style={{ marginTop: 16, marginBottom: 18, position: "relative", display: "inline-block" }}>
              {/* Add image trigger toggles menu with upload vs link choices */}
              <button type="button" onClick={() => setShowAddImageMenu((v) => !v)}>
                Add an image
              </button>
              {showAddImageMenu ? (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 6,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    background: "#fff",
                    padding: "8px 10px",
                    minWidth: 170,
                    zIndex: 1,
                  }}>
                  <div>
                    <Link
                      to={`/ideas/${scene.idea}/images/new/upload?sceneId=${scene.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}>
                      Upload a photo
                    </Link>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link
                      to={`/ideas/${scene.idea}/images/new/link?sceneId=${scene.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}>
                      Add a link
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            {scene.images.length > 0 ? (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}>
                {scene.images.map((image) => (
                  <li key={image.id} style={{ width: 220, flex: "0 0 auto" }}>
                    <Link
                      to={`/images/${image.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ borderRadius: 10, padding: 8, background: "transparent" }}>
                        {image.image ? (
                          <img
                            src={resolveImageSrcForDisplay(image.image) ?? ""}
                            alt={image.description ?? "scene image"}
                            style={{
                              width: "100%",
                              height: 150,
                              objectFit: "cover",
                              display: "block",
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: 150,
                              borderRadius: 8,
                              display: "grid",
                              placeItems: "center",
                              color: "var(--text-muted)",
                              background: "var(--surface)",
                            }}>
                            No image
                          </div>
                        )}
                        <p
                          style={{
                            margin: "8px 0 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                          {image.description || "(no description)"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginTop: 12 }}>No images linked to this scene yet</p>
            )}
          </section>

          <section style={{ marginTop: 48 }}>
            <h2>Drawings in this scene</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Create drawings and reopen them later to continue editing.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(`/ideas/${scene.idea}/drawings/new?sceneId=${scene.id}`, {
                  state: { from: `${location.pathname}${location.search}` },
                })
              }
              style={{ marginTop: 10, marginBottom: 18 }}>
              Create a new drawing
            </button>
            {scene.drawings && scene.drawings.length > 0 ? (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}>
                {scene.drawings.map((drawing) => (
                  <li key={drawing.id} style={{ width: 220, flex: "0 0 auto" }}>
                    <Link
                      to={`/drawings/${drawing.id}`}
                      state={{ from: `${location.pathname}${location.search}` }
                      }
                      style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ borderRadius: 10, padding: 8, background: "transparent" }}>
                        {drawing.thumbnail_data_url ? (
                          <img
                            src={drawing.thumbnail_data_url}
                            alt={drawing.title?.trim() ? drawing.title : "drawing thumbnail"}
                            style={{
                              width: "100%",
                              height: 150,
                              objectFit: "cover",
                              display: "block",
                              borderRadius: 8,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: 150,
                              borderRadius: 8,
                              display: "grid",
                              placeItems: "center",
                              color: "var(--text-muted)",
                              background: "var(--surface)",
                            }}>
                            No preview
                          </div>
                        )}
                        <p
                          style={{
                            margin: "8px 0 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                          {drawing.title?.trim() ? drawing.title : `Drawing #${drawing.id}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginTop: 12 }}>No drawings linked to this scene yet</p>
            )}
          </section>

          <section style={{ marginTop: 42, paddingTop: 24, borderTop: "1px solid #ddd" }}>
            <h2 style={{ color: "#8b0000" }}>Delete scene</h2>
            <p style={{ marginTop: 10 }}>
              This removes the scene and related scene data. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => void handleDeleteScene()} // call the handleDeleteScene function to delete the scene
              disabled={deleteBusy}
              style={{
                marginTop: 14,
                background: "#c00",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
              }}>
              {deleteBusy ? "Deleting..." : "Delete scene"}
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default SceneDetailPage; // export the SceneDetailPage component
