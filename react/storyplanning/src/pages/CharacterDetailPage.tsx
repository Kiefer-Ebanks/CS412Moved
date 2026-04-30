// File: CharacterDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: Character detail from GET /api/characters/:id/ (name, description, nested images). Back navigation restores the prior route via location state.

import { useEffect, useRef, useState } from "react";
import {
  deleteCharacter,
  getIdea,
  getCharacter,
  resolveImageSrcForDisplay,
  updateCharacterDescription,
  updateCharacterName,
  updateCharacterScenes,
  type CharacterDetailResponse,
} from "../api";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

function CharacterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [character, setCharacter] = useState<CharacterDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false); // state for the busy state of the delete character request
  const [editingTitle, setEditingTitle] = useState(false); // state for the inline edit mode for character name
  const [titleDraft, setTitleDraft] = useState(""); // draft text for character title input
  const [titleBusy, setTitleBusy] = useState(false); // state for character name save request
  const [descriptionDraft, setDescriptionDraft] = useState(""); // always-editable character description draft
  const [descriptionBusy, setDescriptionBusy] = useState(false); // state for description save request
  const [descriptionMessage, setDescriptionMessage] = useState(""); // short success text after description save
  const [showAddImageMenu, setShowAddImageMenu] = useState(false); // toggles the Add an image dropdown menu
  const [sceneOptions, setSceneOptions] = useState<Array<{ id: number; title: string }>>([]); // all selectable scenes under the same idea
  const [sceneDraftIds, setSceneDraftIds] = useState<number[]>([]); // local draft of selected scene ids for this character
  const [sceneBusy, setSceneBusy] = useState(false); // save state for scene affiliation updates
  const [sceneMessage, setSceneMessage] = useState(""); // success text after scene affiliation save
  const descriptionMessageTimerRef = useRef<number | null>(null); // auto-clears description success text after a short delay
  const sceneMessageTimerRef = useRef<number | null>(null); // auto-clears scene-save success text after a short delay

  useEffect(() => {
    const pk = id ? Number.parseInt(id, 10) : NaN;
    if (Number.isNaN(pk)) {
      setError("Invalid character id");
      return;
    }

    async function loadCharacter() {
      try {
        const data = await getCharacter(pk);
        setCharacter(data);
        setDescriptionDraft(data.description ?? ""); // initialize description editor with the current description text from the backend
        setSceneDraftIds(data.scenes ?? (data.scene != null ? [data.scene] : [])); // initialize selected scene checkboxes from backend values
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't load the character";
        setError(message);
      }
    }

    void loadCharacter();
  }, [id]);

  useEffect(() => {
    // load all scenes for this character's idea so user can change scene affiliations in one place
    if (!character) {
      return;
    }
    const ideaId = character.idea; // get the idea id for this character

    async function loadIdeaScenes() {
      try {
        const ideaData = (await getIdea(ideaId)) as { scenes?: Array<{ id: number; title: string }> };
        setSceneOptions(ideaData.scenes ?? []);
      } catch {
        setSceneOptions([]);
      }
    }

    void loadIdeaScenes();
  }, [character]);

  useEffect(() => {
    return () => {
      if (descriptionMessageTimerRef.current != null) {
        window.clearTimeout(descriptionMessageTimerRef.current);
      }
      if (sceneMessageTimerRef.current != null) {
        window.clearTimeout(sceneMessageTimerRef.current);
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
    // enter edit mode when user double-clicks a character name
    if (!character) return;
    setEditingTitle(true);
    setTitleDraft(character.name);
    setError("");
  }

  async function saveTitle() {
    // saves the name from the inline edit to the server and update the local name text

    if (!character) return;

    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setError("Character name cannot be blank.");
      return;
    }
    if (trimmed === character.name.trim()) {
      setEditingTitle(false);
      return;
    }
    setTitleBusy(true);
    try {
      const updated = await updateCharacterName(character.id, trimmed);
      setCharacter({ ...character, name: updated.name, timestamp: updated.timestamp });
      setEditingTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update character name");
    } finally {
      setTitleBusy(false);
    }
  }

  async function handleSaveDescription() {
    // saves the description from the inline edit to the server and update the local description text
    if (!character) return;
    setDescriptionMessage(""); // clear any previous success messages
    setDescriptionBusy(true); // set the description busy state to true
    try {
      const updated = await updateCharacterDescription(character.id, descriptionDraft); // call the update character description function to update the description in the backend

      setCharacter({ ...character, description: updated.description, timestamp: updated.timestamp }); // update the local description text and timestamp with the new description text and timestamp from the backend
      setDescriptionMessage("Description saved"); // set the success message to "Description saved"
      if (descriptionMessageTimerRef.current != null) {
        window.clearTimeout(descriptionMessageTimerRef.current);
      }
      descriptionMessageTimerRef.current = window.setTimeout(() => {
        setDescriptionMessage("");
        descriptionMessageTimerRef.current = null;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update character description");
    } finally {
      setDescriptionBusy(false);
    }
  }

  async function handleDeleteCharacter() {
    // deletes the character and the backend cascades the delete to remove all related images
    if (!character) return;

    // confirm the deletion with the user with a confirmation dialog box
    if (!window.confirm("Delete this character and related character data? This cannot be undone.")) {
      return;
    }
    setDeleteBusy(true);
    try {
      const ideaId = character.idea; // capture parent idea before delete to have a safe redirect target
      await deleteCharacter(character.id);
      navigate(`/ideas/${ideaId}`, { replace: true }); // navigate to the parent idea detail page after the character is deleted
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete character");
    } finally {
      setDeleteBusy(false);
    }
  }

  function toggleSceneDraft(sceneId: number) {
    // toggles one scene id in and out of the draft selection list
    setSceneDraftIds((prev) =>
      prev.includes(sceneId) ? prev.filter((id) => id !== sceneId) : [...prev, sceneId],
    );
  }

  async function handleSaveScenes() {
    // saves the selected affiliated scenes for this character via PATCH
    if (!character || sceneBusy) return;
    setSceneBusy(true);
    setSceneMessage("");
    setError("");
    try {
      const updated = await updateCharacterScenes(character.id, sceneDraftIds);
      setCharacter({
        ...character,
        scenes: updated.scenes ?? [],
        scene: updated.scene,
        timestamp: updated.timestamp,
      });
      setSceneDraftIds(updated.scenes ?? (updated.scene != null ? [updated.scene] : []));
      setSceneMessage("Scene affiliations saved");
      if (sceneMessageTimerRef.current != null) {
        window.clearTimeout(sceneMessageTimerRef.current);
      }
      sceneMessageTimerRef.current = window.setTimeout(() => {
        setSceneMessage("");
        sceneMessageTimerRef.current = null;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update scene affiliations");
    } finally {
      setSceneBusy(false);
    }
  }

  // show "Unsaved changes" when editor text differs from the saved description on the character object
  const descriptionDirty = character ? descriptionDraft !== (character.description ?? "") : false;
  const savedSceneIds = character ? (character.scenes ?? (character.scene != null ? [character.scene] : [])) : []; // get the list of scene ids from the character object or the single scene id if there is only one
  const sceneDirty =
    character && // check if the character object is not null
    (savedSceneIds.length !== sceneDraftIds.length || // check if the list of saved scene ids is not the same length as the list of scene draft ids
      savedSceneIds.some((id) => !sceneDraftIds.includes(id))); // check if any of the saved scene ids are not in the list of scene draft ids

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      {error ? (
        <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>
      ) : null}

      {!character && !error ? <p>Loading...</p> : null}

      {character ? (
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
                  setTitleDraft(character.name);
                }
              }}
              style={{ fontSize: "1.8rem", fontWeight: 700, width: "100%", margin: "0 0 10px" }}
            />
          ) : (
            <h1 title="Double-click to rename" onDoubleClick={startTitleEdit} style={{ cursor: "text" }}>
              {character.name}
            </h1>
          )}
          <p>
            <strong>Last updated:</strong> {formatTimestamp(character.timestamp)}
          </p>
          <section style={{ marginTop: 24 }}>
            <h2>Description</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Edit freely. Changes save only when you press Save changes.
            </p>
            <div style={{ height: 340, border: "1px solid #ddd", borderRadius: 6, overflow: "auto" }}>
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                placeholder="Write character description..."
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
              {descriptionMessage ? (
                <span style={{ color: "green" }}>{descriptionMessage}</span>
              ) : descriptionDirty ? (
                <span style={{ color: "#990000" }}>Unsaved changes</span>
              ) : null}
              <button type="button" onClick={() => void handleSaveDescription()} disabled={descriptionBusy}>
                {descriptionBusy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>

          <section style={{ marginTop: 34 }}>
            <fieldset style={{ border: "1px solid #777", borderRadius: 0, margin: 0, padding: 12 }}>
              <legend style={{ padding: "0 6px", marginLeft: 6, fontSize: "1.5rem", fontWeight: 700 }}>
                Affiliated scenes
              </legend>
              <p style={{ marginTop: -1, marginBottom: 12, color: "var(--text-muted)", fontSize: "1.07rem" }}>
                Select all scenes this character belongs to, then save
              </p>
              {sceneOptions.length > 0 ? (
                <div style={{ display: "grid", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 6 }}>
                  {sceneOptions.map((scene) => (
                    <label key={scene.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={sceneDraftIds.includes(scene.id)}
                        onChange={() => toggleSceneDraft(scene.id)}
                      />
                      <span>{scene.title}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0 }}>No scenes available for this idea yet.</p>
              )}
            </fieldset>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
              {sceneMessage ? (
                <span style={{ color: "green" }}>{sceneMessage}</span>
              ) : sceneDirty ? (
                <span style={{ color: "#990000" }}>Unsaved changes</span>
              ) : null}
              <button type="button" onClick={() => void handleSaveScenes()} disabled={sceneBusy}>
                {sceneBusy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>

          {/* Images linked to this character in the DB (Image.character FK); same resolve helper as scene/idea pages */}
          <section style={{ marginTop: 34 }}>
            <h2>Images for this character</h2>
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
                      to={`/ideas/${character.idea}/images/new/upload?characterId=${character.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}>
                      Upload a photo
                    </Link>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link
                      to={`/ideas/${character.idea}/images/new/link?characterId=${character.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}>
                      Add a link
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            {character.images && character.images.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {character.images.map((img) => (
                  <li key={img.id} style={{ marginBottom: 16 }}>
                    <Link
                      to={`/images/${img.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {img.image ? (
                        <>
                          <img
                            src={resolveImageSrcForDisplay(img.image) ?? ""}
                            alt={img.description ?? "character image"}
                            style={{ maxWidth: "100%", maxHeight: 240, display: "block" }}
                          />
                        </>
                      ) : null}
                      <p>{img.description || "(no description)"}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginTop: 12 }}>No images linked to this character yet</p>
            )}
          </section>

          <section style={{ marginTop: 56 }}>
            <h2>Drawings for this character</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Create drawings and reopen them later to continue editing.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(`/ideas/${character.idea}/drawings/new?characterId=${character.id}`, {
                  state: { from: `${location.pathname}${location.search}` },
                })
              }
              style={{ marginTop: 10, marginBottom: 18 }}>
              Create a new drawing
            </button>
            {character.drawings && character.drawings.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {character.drawings.map((drawing) => (
                  <li key={drawing.id} style={{ marginBottom: 16 }}>
                    <Link
                      to={`/drawings/${drawing.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      style={{ textDecoration: "none", color: "inherit" }}>
                      {drawing.thumbnail_data_url ? (
                        <img
                          src={drawing.thumbnail_data_url}
                          alt={drawing.title?.trim() ? drawing.title : "drawing thumbnail"}
                          style={{ maxWidth: "100%", maxHeight: 180, display: "block", border: "1px solid #ddd", borderRadius: 6 }}
                        />
                      ) : null}
                      <p style={{ marginTop: 8 }}>
                        {drawing.title?.trim() ? drawing.title : `Drawing #${drawing.id}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginTop: 12 }}>No drawings linked to this character yet</p>
            )}
          </section>

          <section style={{ marginTop: 42, paddingTop: 24, borderTop: "1px solid #ddd" }}>
            <h2 style={{ color: "#8b0000", marginBottom: 10 }}>Delete character</h2>
            <p style={{ marginTop: 0, marginBottom: 18 }}>
              This removes the character and related character data. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => void handleDeleteCharacter()}
              disabled={deleteBusy}
              style={{ marginTop: 4, background: "#c00", color: "#fff", border: "none", padding: "8px 14px" }}>
              {deleteBusy ? "Deleting..." : "Delete character"}
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default CharacterDetailPage; // export the CharacterDetailPage component
