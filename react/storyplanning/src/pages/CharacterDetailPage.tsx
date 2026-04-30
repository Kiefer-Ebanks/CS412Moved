// File: CharacterDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: Character detail from GET /api/characters/:id/ (name, description, nested images). Back navigation restores the prior route via location state.

import { useEffect, useState } from "react";
import {
  clearToken,
  deleteCharacter,
  getCharacter,
  resolveImageSrcForDisplay,
  updateCharacterDescription,
  updateCharacterName,
  type CharacterDetailResponse,
} from "../api";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

// shape of the from state object that we get from the location state
type FromState = {
  from?: string;
};

function CharacterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;

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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't load the character";
        setError(message);
      }
    }

    void loadCharacter();
  }, [id]);

  function handleBack() {
    // if opened from another page, go there first (for normal cross-page navigation)
    if (from) {
      navigate(from);
      return;
    }
    // fallback path avoids returning to create form: scene first when present, otherwise idea
    if (character?.scene != null) {
      navigate(`/scenes/${character.scene}`);
      return;
    }
    if (character) {
      navigate(`/ideas/${character.idea}`);
      return;
    }
    navigate("/ideas");
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
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

  // show "Unsaved changes" when editor text differs from the saved description on the character object
  const descriptionDirty = character ? descriptionDraft !== (character.description ?? "") : false;

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <button type="button" onClick={handleBack}>
          &larr; Back
        </button>
      </p>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>

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
            <strong>Last updated:</strong> {character.timestamp}
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
              {descriptionDirty ? <span style={{ color: "#990000" }}>Unsaved changes</span> : null}
              <button type="button" onClick={() => void handleSaveDescription()} disabled={descriptionBusy}>
                {descriptionBusy ? "Saving..." : "Save changes"}
              </button>
              {descriptionMessage ? <span style={{ color: "green" }}>{descriptionMessage}</span> : null}
            </div>
          </section>

          {/* Images linked to this character in the DB (Image.character FK); same resolve helper as scene/idea pages */}
          <section style={{ marginTop: 24 }}>
            <h2>Images for this character</h2>
            <div style={{ marginBottom: 10, position: "relative", display: "inline-block" }}>
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
              <p>No images linked to this character yet</p>
            )}
          </section>

          <section style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid #ddd" }}>
            <h2 style={{ color: "#8b0000" }}>Delete character</h2>
            <p>This removes the character and related character data. This cannot be undone.</p>
            <button
              type="button"
              onClick={() => void handleDeleteCharacter()}
              disabled={deleteBusy}
              style={{ background: "#c00", color: "#fff", border: "none", padding: "8px 14px" }}>
              {deleteBusy ? "Deleting..." : "Delete character"}
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default CharacterDetailPage; // export the CharacterDetailPage component
