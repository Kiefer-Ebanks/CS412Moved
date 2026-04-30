// File: ImageDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/30/2026
// Description: shows an image and its description; Back uses location state. Links to parent idea and, when set, scene and character.

import { useEffect, useRef, useState } from "react";
import {
  clearToken,
  deleteImage,
  getImage,
  resolveImageSrcForDisplay,
  type ImageDetailResponse,
  updateImageDescription,
} from "../api";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

type FromState = {
  from?: string;
};

function ImageDetailPage() {
  const { id } = useParams(); // get the image id from the route
  const navigate = useNavigate(); // will use this to navigate to the previous page
  const location = useLocation(); // get the current page location
  const from = (location.state as FromState | null)?.from; // get the previous page location from the state
  // when linking to idea/scene/character, pass this so their Back (where supported) returns to this image page
  const returnTo = `${location.pathname}${location.search}`;

  const [image, setImage] = useState<ImageDetailResponse | null>(null); // state to store the image
  const [error, setError] = useState(""); // state to store any errors
  const [descriptionDraft, setDescriptionDraft] = useState(""); // always-editable draft text for image description
  const [descriptionBusy, setDescriptionBusy] = useState(false); // tracks save request state for description
  const [descriptionMessage, setDescriptionMessage] = useState(""); // short success text after description save
  const [deleteBusy, setDeleteBusy] = useState(false); // tracks delete request state for this image
  const descriptionMessageTimerRef = useRef<number | null>(null); // auto-clears success text after a short delay

  useEffect(() => {
    const pk = id ? Number.parseInt(id, 10) : NaN; // get the image id from the route
    if (Number.isNaN(pk)) {
      setError("Invalid image id");
      return;
    }

    async function loadImage() {
      try {
        const data = await getImage(pk);
        setImage(data);
        setDescriptionDraft(data.description ?? ""); // initialize the description editor with the current description text from the backend
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't load the image";
        setError(message);
      }
    }

    void loadImage();
  }, [id]);

  function handleBack() {
    // if opened from another page, go there first (for normal cross-page navigation)
    if (from) {
      navigate(from);
      return;
    }
    // fallback path avoids returning to create form: character first, then scene, then idea
    if (image?.character != null) {
      navigate(`/characters/${image.character}`);
      return;
    }
    if (image?.scene != null) {
      navigate(`/scenes/${image.scene}`);
      return;
    }
    if (image) {
      navigate(`/ideas/${image.idea}`);
      return;
    }
    navigate("/ideas");
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  async function handleSaveDescription() {
    // saves the current description draft only when user explicitly clicks Save changes
    if (!image || descriptionBusy) {
      return;
    }
    setDescriptionBusy(true);
    setDescriptionMessage("");
    setError("");
    try {
      const updated = await updateImageDescription(image.id, descriptionDraft);
      setImage(updated);
      setDescriptionDraft(updated.description ?? "");
      setDescriptionMessage("Saved");
      if (descriptionMessageTimerRef.current != null) {
        window.clearTimeout(descriptionMessageTimerRef.current);
      }
      descriptionMessageTimerRef.current = window.setTimeout(() => {
        setDescriptionMessage("");
        descriptionMessageTimerRef.current = null;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save description");
    } finally {
      setDescriptionBusy(false);
    }
  }

  async function handleDeleteImage() {
    // confirms and deletes this image then returns user to the last page they were on
    if (!image || deleteBusy) {
      return;
    }

    // confirm the deletion with the user with a confirmation dialog box
    const confirmed = window.confirm(
      "Delete this image? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }
    setDeleteBusy(true);
    setError("");
    try {
      await deleteImage(image.id); // call the delete image function to delete the image from the backend
      if (from) {
        navigate(from); // navigate to the last page the user was on
      } else {
        navigate(`/ideas/${image.idea}`); // navigate to the idea detail page
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete image");
      setDeleteBusy(false);
    }
  }

  const src = image ? resolveImageSrcForDisplay(image.image) : undefined;
  const descriptionDirty = image ? descriptionDraft !== (image.description ?? "") : false; // check if the description draft is different from the current description

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

      {!image && !error ? <p>Loading...</p> : null}

      {image ? (
        <>
          <p>
            <strong>Last updated:</strong> {image.timestamp}
          </p>
          {src ? (
            <img
              src={src}
              alt={image.description ?? "story planning image"}
              style={{ maxWidth: "100%", height: "auto", display: "block" }}
            />
          ) : (
            <p>No image URL (upload or URL may be missing).</p>
          )}
          <section style={{ marginTop: 24 }}>
            <h2>Description</h2>
            <p style={{ marginTop: 0, color: "#555" }}>
              Edit freely. Changes save only when you press Save changes.
            </p>
            <div style={{ height: 260, border: "1px solid #ddd", borderRadius: 6, overflow: "auto" }}>
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                placeholder="Write image description..."
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
          <nav style={{ marginTop: 16, fontSize: "0.9rem", color: "#555" }} aria-label="Related records">
            <strong>Go to:</strong>{" "}

            {/* labels use idea_title / scene_title / character_name from the API when present */}
            <Link to={`/ideas/${image.idea}`} state={{ from: returnTo }}>
              {image.idea_title?.trim() ? image.idea_title : `Idea`}
            </Link>
            {image.scene != null ? (
              <>
                {" · "}
                <Link to={`/scenes/${image.scene}`} state={{ from: returnTo }}>
                  {image.scene_title?.trim()
                    ? image.scene_title
                    : `Scene`}
                </Link>
              </>
            ) : null}
            {image.character != null ? (
              <>
                {" · "}
                <Link
                  to={`/characters/${image.character}`}
                  state={{ from: returnTo }}
                >
                  {image.character_name?.trim()
                    ? image.character_name
                    : `Character`}
                </Link>
              </>
            ) : null}
          </nav>

          <section style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #ddd" }}>
            <h3 style={{ marginTop: 0 }}>Delete image</h3>
            <p style={{ color: "#555" }}>
              This removes this image entry permanently.
            </p>
            <button
              type="button"
              onClick={() => void handleDeleteImage()}
              disabled={deleteBusy}
              style={{
                background: "#b00020",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: 4,
                cursor: deleteBusy ? "not-allowed" : "pointer",
              }}>
              {deleteBusy ? "Deleting..." : "Delete image"}
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default ImageDetailPage;
