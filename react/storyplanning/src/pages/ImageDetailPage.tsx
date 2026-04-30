// File: ImageDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/30/2026
// Description: shows an image and its description; Back uses location state. Links to parent idea and, when set, scene and character.

import { useEffect, useState } from "react";
import {
  clearToken,
  getImage,
  resolveImageSrcForDisplay,
  type ImageDetailResponse,
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't load the image";
        setError(message);
      }
    }

    void loadImage();
  }, [id]);

  function handleBack() {
    if (from) {
      navigate(from);
      return;
    }
    navigate(-1);
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  const src = image ? resolveImageSrcForDisplay(image.image) : undefined;

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
            <p style={{ whiteSpace: "pre-wrap" }}>
              {image.description?.trim() ? image.description : "(no description)"}
            </p>
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
        </>
      ) : null}
    </main>
  );
}

export default ImageDetailPage;
