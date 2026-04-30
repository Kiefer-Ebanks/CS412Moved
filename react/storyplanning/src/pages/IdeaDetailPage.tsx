// File: IdeaDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// This page displays the details of a single idea, including the title, storyboard, scenes, characters, and images
// It also allows the user to logout and navigate back to the ideas list

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  clearToken,
  deleteIdea,
  getIdea,
  resolveImageSrcForDisplay,
  updateIdeaStoryboard,
  updateIdeaTitle,
  updateCharacterName,
  updateSceneTitle,
  type DrawingRow,
  type ImageRow,
} from "../api";

// scene model shape from IdeaSerializer
type SceneRow = {
  id: number;
  title: string;
  outline?: string;
  script?: string;
};

// character row object from IdeaSerializer
type CharacterRow = {
  id: number;
  name: string;
  description?: string;
};

// shape of the idea detail response from the ideas endpoint
type IdeaDetail = {
  id: number;
  title: string;
  storyboard: string;
  timestamp: string;
  user: number;
  scenes?: SceneRow[];
  characters?: CharacterRow[];
  images?: ImageRow[];
  drawings?: DrawingRow[];
};

type FromState = {
  from?: string;
};

function IdeaDetailPage() {
  // Get the idea id from the URL and navigate to the idea detail page

  const { id } = useParams(); // get the idea id from the URL
  const navigate = useNavigate(); // navigate to the idea detail page
  const location = useLocation(); // get the current page location
  const backTo = (location.state as FromState | null)?.from; // e.g. return to image detail when opened from there

  // State for the idea detail
  const [idea, setIdea] = useState<IdeaDetail | null>(null); // the idea detail object
  const [error, setError] = useState(""); // the error message
  const [deleteBusy, setDeleteBusy] = useState(false); // state for idea deletion request status
  const [editingIdeaTitle, setEditingIdeaTitle] = useState(false); // inline edit mode state for idea title
  const [ideaTitleDraft, setIdeaTitleDraft] = useState(""); // the current draft text of the idea title input field before it is saved
  const [ideaTitleBusy, setIdeaTitleBusy] = useState(false); // state for the idea title update request status
  const [storyboardDraft, setStoryboardDraft] = useState(""); // always-editable storyboard text area draft
  const [storyboardBusy, setStoryboardBusy] = useState(false); // state for storyboard save request status
  const [storyboardMessage, setStoryboardMessage] = useState(""); // short success text after storyboard save
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null); // state of the scene row that is currently in edit mode
  const [sceneTitleDraft, setSceneTitleDraft] = useState(""); // the current draft text of the scene title input field before it is saved
  const [sceneTitleBusyId, setSceneTitleBusyId] = useState<number | null>(null); // state for the scene title update request status
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null); // state of the character row currently being renamed
  const [characterNameDraft, setCharacterNameDraft] = useState(""); // draft text for inline character rename input
  const [characterNameBusyId, setCharacterNameBusyId] = useState<number | null>(null); // busy state for one character rename save
  const [showAddImageMenu, setShowAddImageMenu] = useState(false); // toggles the Add an image dropdown menu

  useEffect(() => {
    const pk = id ? Number.parseInt(id, 10) : NaN;
    if (Number.isNaN(pk)) {
      setError("Invalid idea id");
      return;
    }

    async function load() {
      try {
        const data = (await getIdea(pk)) as IdeaDetail;
        setIdea(data);
        setStoryboardDraft(data.storyboard ?? ""); // initialize editor with current storyboard text from the backend
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load the idea";
        setError(message);
      }
    }

    load();
  }, [id]);

  function handleLogout() {
    clearToken();
    navigate("/login"); // navigate to the login page
  }

  function startIdeaTitleEdit() {
    // enter edit mode when user double-clicks the idea title

    if (!idea) return;

    setEditingIdeaTitle(true); // set the editing idea title state to true
    setIdeaTitleDraft(idea.title); // set the idea title draft to the current title of the idea
    setError(""); // clear any previous errors
  }

  async function saveIdeaTitle() {
    if (!idea) return;
    const trimmed = ideaTitleDraft.trim();
    if (!trimmed) {
      setError("Idea title cannot be blank.");
      return;
    }
    if (trimmed === idea.title.trim()) {
      setEditingIdeaTitle(false);
      return;
    }
    setIdeaTitleBusy(true);
    try {
      const updated = await updateIdeaTitle(idea.id, trimmed);
      setIdea({ ...idea, title: updated.title, timestamp: updated.timestamp }); // updating the title and timestamp so "Last updated" refreshes immediately
      setEditingIdeaTitle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update idea title");
    } finally {
      setIdeaTitleBusy(false);
    }
  }

  function startSceneTitleEdit(scene: SceneRow) {
    // enter edit mode when user double-clicks a scene title

    setEditingSceneId(scene.id); // set the editing scene id to the id of the scene that the user double-clicked
    setSceneTitleDraft(scene.title); // set the scene title draft to the current title of the scene that the user double-clicked
    setError(""); // clear any previous errors
  }

  async function saveSceneTitle(scene: SceneRow) {
    // saves the scene title from the inline edit to the server and update the local list of scenes

    if (!idea) return;
    const trimmed = sceneTitleDraft.trim();
    if (!trimmed) {
      setError("Scene title cannot be blank.");
      return;
    }
    if (trimmed === scene.title.trim()) {
      setEditingSceneId(null);
      setSceneTitleDraft("");
      return;
    }
    setSceneTitleBusyId(scene.id);
    try {
      const updated = await updateSceneTitle(scene.id, trimmed);
      // patch the local list row after server confirms
      setIdea({
        ...idea,
        scenes: idea.scenes?.map((row) => (row.id === scene.id ? { ...row, title: updated.title } : row)),
      });
      setEditingSceneId(null);
      setSceneTitleDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update scene title");
    } finally {
      setSceneTitleBusyId(null);
    }
  }

  function startCharacterNameEdit(character: CharacterRow) {
    // enter edit mode when user double-clicks a character name
    setEditingCharacterId(character.id);
    setCharacterNameDraft(character.name);
    setError("");
  }

  async function saveCharacterName(character: CharacterRow) {
    // saves the character name from the inline edit to the server and update the local list of characters

    if (!idea) return;
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
      setIdea({
        ...idea,
        characters: idea.characters?.map((row) =>
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

  async function handleDeleteIdea() {
    if (!idea) return;

    // dialog box pop up to confirm the user wants to delete the idea
    if (!window.confirm("Delete this idea and all related scenes, characters, and images?")) {
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteIdea(idea.id);
      navigate("/ideas", { replace: true }); // navigate to the all ideas page after the idea is deleted
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete idea");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleSaveStoryboard() {
    // saves the storyboard from the inline edit to the server and update the local list of ideas
    
    if (!idea) return;
    setStoryboardMessage(""); // clear any previous success messages
    setStoryboardBusy(true); // set the storyboard busy state to true
    try {
      const updated = await updateIdeaStoryboard(idea.id, storyboardDraft); // update the storyboard on the server
      
      // keep local idea object in sync so other sections show current text if needed
      setIdea({ ...idea, storyboard: updated.storyboard, timestamp: updated.timestamp }); // updating the storyboard and timestamp so "Last updated" refreshes immediately
      setStoryboardMessage("Storyboard saved"); // set the success message to "Storyboard saved."
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update storyboard");
    } finally {
      setStoryboardBusy(false);
    }
  }

  // show "Unsaved changes" when editor text differs from the saved storyboard on the idea object
  const storyboardDirty = idea ? storyboardDraft !== (idea.storyboard ?? "") : false;

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        {backTo ? (
          <>
            <Link to={backTo}>&larr; Back</Link>
            {" · "}
          </>
        ) : null}
        <Link to="/ideas">&larr; Back to ideas</Link>
      </p>

      <button type="button" onClick={handleLogout}>
        Logout
      </button>

      {error ? (
        <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>
      ) : null}

      {!idea && !error ? <p>Loading...</p> : null}

      {idea ? (
        <>
          {editingIdeaTitle ? (
            <input
              autoFocus
              value={ideaTitleDraft}
              onChange={(e) => setIdeaTitleDraft(e.target.value)}
              disabled={ideaTitleBusy}
              onBlur={() => void saveIdeaTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveIdeaTitle();
                } else if (e.key === "Escape") {
                  setEditingIdeaTitle(false);
                  setIdeaTitleDraft(idea.title);
                }
              }}
              style={{ fontSize: "1.8rem", fontWeight: 700, width: "100%", margin: "0 0 10px" }}
            />
          ) : (
            <h1 title="Double-click to rename" onDoubleClick={startIdeaTitleEdit} style={{ cursor: "text" }}>
              {idea.title}
            </h1>
          )}
          <p>
            <strong>Last updated:</strong> {idea.timestamp}
          </p>
          <section style={{ marginTop: 24 }}>
            <h2>Storyboard</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Click in and edit freely. Changes save only when you click Save changes.
            </p>
            {/* fixed-height "document window" so long text scrolls inside this panel */}
            <div style={{ height: 340, border: "1px solid #ddd", borderRadius: 6, overflow: "auto" }}>
              <textarea
                value={storyboardDraft}
                onChange={(e) => setStoryboardDraft(e.target.value)}
                placeholder="Write your storyboard..."
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
              {storyboardDirty ? <span style={{ color: "#990000" }}>Unsaved changes</span> : null}
              <button type="button" onClick={() => void handleSaveStoryboard()} disabled={storyboardBusy}>
                {storyboardBusy ? "Saving..." : "Save changes"}
              </button>
              {storyboardMessage ? <span style={{ color: "green" }}>{storyboardMessage}</span> : null}
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Scenes</h2>
            {idea.scenes && idea.scenes.length > 0 ? (
              <ul>
                {/* create-scene row, formatted like list rows but the text is not editable */}
                <li style={{ marginBottom: 12 }}>
                  <strong>Create a new scene</strong>
                  {"  "}
                  <Link to={`/ideas/${idea.id}/scenes/new`}>&rarr;</Link>
                </li>

                {idea.scenes.map((s) => (
                  <li key={s.id}>
                    {editingSceneId === s.id ? (
                      <input
                        autoFocus
                        value={sceneTitleDraft}
                        onChange={(e) => setSceneTitleDraft(e.target.value)}
                        disabled={sceneTitleBusyId === s.id}
                        onBlur={() => void saveSceneTitle(s)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void saveSceneTitle(s);
                          } else if (e.key === "Escape") {
                            setEditingSceneId(null);
                            setSceneTitleDraft("");
                          }
                        }}
                        style={{ width: "100%", maxWidth: 420, marginBottom: 4 }}
                      />
                    ) : (
                      <>
                        {/* double-click scene title to edit it inline */}
                        <strong
                          title="Double-click to rename" // title attribute to display when hovering over the scene title
                          onDoubleClick={() => startSceneTitleEdit(s)}
                          style={{ cursor: "text" }}> {/* changing the cursor to text when the scene title is double-clicked */}
                          {s.title} {/* display the scene title */}
                        </strong>
                        {"  "}
                        <Link to={`/scenes/${s.id}`}>&rarr;</Link> {/* link to the scene detail page */}
                      </>
                    )}
                    {s.outline ? (
                      <p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>
                        {s.outline}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p>No scenes yet</p>
                <p>
                  <strong>Create a new scene</strong>
                  {"  "}
                  <Link to={`/ideas/${idea.id}/scenes/new`}>&rarr;</Link> {/* link to the create scene page */}
                </p>
              </>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Characters</h2>
            {idea.characters && idea.characters.length > 0 ? (
              <ul>
                {/* create-character row, formatted like list rows but not editable */}
                <li style={{ marginBottom: 12 }}>
                  <strong>Create a new character</strong>
                  {"  "}
                  <Link
                    to={`/ideas/${idea.id}/characters/new`}
                    state={{ from: `${location.pathname}${location.search}` }}>
                    &rarr;
                  </Link>
                </li>

                {idea.characters.map((c) => (
                  <li key={c.id}>
                    {editingCharacterId === c.id ? (
                      <input
                        autoFocus
                        value={characterNameDraft}
                        onChange={(e) => setCharacterNameDraft(e.target.value)}
                        disabled={characterNameBusyId === c.id}
                        onBlur={() => void saveCharacterName(c)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void saveCharacterName(c);
                          } else if (e.key === "Escape") {
                            setEditingCharacterId(null);
                            setCharacterNameDraft("");
                          }
                        }}
                        style={{ width: "100%", maxWidth: 420, marginBottom: 4 }}
                      />
                    ) : (
                      <>
                        <strong
                          title="Double-click to rename"
                          onDoubleClick={() => startCharacterNameEdit(c)}
                          style={{ cursor: "text" }}>
                          {c.name}
                        </strong>
                        {"  "}
                        <Link
                          to={`/characters/${c.id}`}
                          state={{ from: `${location.pathname}${location.search}` }}>
                          &rarr;
                        </Link>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p>No characters yet</p>
                <p>
                  <strong>Create a new character</strong>
                  {"  "}
                  <Link
                    to={`/ideas/${idea.id}/characters/new`}
                    state={{ from: `${location.pathname}${location.search}` }}>
                    &rarr;
                  </Link>
                </p>
              </>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Images</h2>
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
                      to={`/ideas/${idea.id}/images/new/upload`}
                      state={{ from: `${location.pathname}${location.search}` }}>
                      Upload a photo
                    </Link>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Link
                      to={`/ideas/${idea.id}/images/new/link`}
                      state={{ from: `${location.pathname}${location.search}` }}>
                      Add a link
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            {idea.images && idea.images.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {idea.images.map((img) => (
                  <li key={img.id} style={{ marginBottom: 16 }}>
                    {/* whole card is clickable so we pass `from` for Back on the image detail page */}
                    <Link
                      to={`/images/${img.id}`}
                      state={{ from: `${location.pathname}${location.search}` }}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {img.image ? (
                        <>
                          {/* since the backend may return /media images we call resolveImageSrcForDisplay to add the Django host so <img> loads correctly */}
                          <img
                            src={resolveImageSrcForDisplay(img.image) ?? ""}
                            alt={img.description ?? "idea image"}
                            style={{ maxWidth: "100%", maxHeight: 240, display: "block" }}
                          />
                        </>
                      ) : null}
                      <p>{img.description || "No description"}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No images yet</p>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Drawings</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Create drawings and reopen them later to continue editing.
            </p>
            <p>
              <strong>Create a new drawing</strong>
              {"  "}
              <Link
                to={`/ideas/${idea.id}/drawings/new`}
                state={{ from: `${location.pathname}${location.search}` }}>
                &rarr;
              </Link>
            </p>
            {idea.drawings && idea.drawings.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {idea.drawings.map((drawing) => (
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
              <p>No drawings yet</p>
            )}
          </section>

          <section style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid #ddd" }}>
            <h2 style={{ color: "#8b0000" }}>Delete idea</h2>
            <p>
              This removes the idea and all related scenes, characters, and images. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => void handleDeleteIdea()}
              disabled={deleteBusy}
              style={{ background: "#c00", color: "#fff", border: "none", padding: "8px 14px" }}>
              {deleteBusy ? "Deleting..." : "Delete idea"}
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default IdeaDetailPage; // export the IdeaDetailPage component
