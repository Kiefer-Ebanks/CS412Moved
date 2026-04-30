// File: SceneDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: This page displays the details of a single scene, including title, outline, script, characters, and images

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  clearToken,
  getScene,
  resolveImageSrcForDisplay,
  type SceneDetailResponse,
} from "../api";

function SceneDetailPage() {

  // Get the scene id from the URL and setup navigation
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // get the current page location

  // State for the scene detail response and error text
  const [scene, setScene] = useState<SceneDetailResponse | null>(null);
  const [error, setError] = useState("");

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

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
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
          <h1>{scene.title}</h1>
          <p>
            <strong>Last updated:</strong> {scene.timestamp}
          </p>

          <section style={{ marginTop: 24 }}>
            <h2>Outline</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{scene.outline || "No outline"}</p>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Script</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{scene.script || "No script"}</p>
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
                    {image.image ? (
                      <>
                        {/* convert media paths to full URLs so uploaded files load in React */}
                        <img
                          src={resolveImageSrcForDisplay(image.image) ?? ""}
                          alt={image.description ?? "scene image"}
                          style={{ maxWidth: "100%", maxHeight: 240 }}
                        />
                      </>
                    ) : null}
                    <p>{image.description || "(no description)"}</p>
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
