// File: IdeaDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// This page displays the details of a single idea, including the title, storyboard, scenes, characters, and images
// It also allows the user to logout and navigate back to the ideas list

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { clearToken, getIdea, resolveImageSrcForDisplay } from "../api";

// scene row object from IdeaSerializer
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

// image row object from IdeaSerializer
type ImageRow = {
  id: number;
  image?: string;
  description?: string;
};

// Shape of the idea detail response from GET /api/ideas/:id/ 
type IdeaDetail = {
  id: number;
  title: string;
  storyboard: string;
  timestamp: string;
  user: number;
  scenes?: SceneRow[];
  characters?: CharacterRow[];
  images?: ImageRow[];
};

function IdeaDetailPage() {
  // Get the idea id from the URL and navigate to the idea detail page

  const { id } = useParams(); // get the idea id from the URL
  const navigate = useNavigate(); // navigate to the idea detail page
  const location = useLocation(); // get the current page location

  // State for the idea detail
  const [idea, setIdea] = useState<IdeaDetail | null>(null); // the idea detail object
  const [error, setError] = useState(""); // the error message

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

  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
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
          <h1>{idea.title}</h1>
          <p>
            <strong>Last updated:</strong> {idea.timestamp}
          </p>
          <section style={{ marginTop: 24 }}>
            <h2>Storyboard</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {idea.storyboard || "No storyboard"}
            </p>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Scenes</h2>
            {idea.scenes && idea.scenes.length > 0 ? (
              <ul>
                {idea.scenes.map((s) => (
                  <li key={s.id}>
                    {/* clicking the scene title takes the user to the scene detail page */}
                    <Link to={`/scenes/${s.id}`}>
                      <strong>{s.title}</strong>
                    </Link>
                    {s.outline ? (
                      <p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>
                        {s.outline}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No scenes yet</p>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Characters</h2>
            {idea.characters && idea.characters.length > 0 ? (
              <ul>
                {idea.characters.map((c) => (
                  <li key={c.id}>
                    <Link
                      // clicking the character name takes the user to the character detail page
                      to={`/characters/${c.id}`}
                      // save the current page location in the state so the user can be redirected back to it after going to the character detail page
                      state={{ from: `${location.pathname}${location.search}` }}
                    >
                      <strong>{c.name}</strong>
                    </Link>
                    {c.description ? (
                      <p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>
                        {c.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No characters yet</p>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Images</h2>
            {idea.images && idea.images.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {idea.images.map((img) => (
                  <li key={img.id} style={{ marginBottom: 16 }}>
                    {img.image ? (
                      <>
                        {/* since the backend may return /media images we call resolveImageSrcForDisplay to add the Django host so <img> loads correctly */}
                        <img
                          src={resolveImageSrcForDisplay(img.image) ?? ""}
                          alt={img.description ?? "idea image"}
                          style={{ maxWidth: "100%", maxHeight: 240 }}
                        />
                      </>
                    ) : null}
                    <p>{img.description || "No description"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No images yet</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default IdeaDetailPage; // export the IdeaDetailPage component
