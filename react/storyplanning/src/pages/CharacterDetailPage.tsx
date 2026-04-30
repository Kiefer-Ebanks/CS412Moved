// File: CharacterDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: Character detail from GET /api/characters/:id/ (name, description, nested images). Back navigation restores the prior route via location state.

import { useEffect, useState } from "react";
import {
  clearToken,
  deleteCharacter,
  getCharacter,
  resolveImageSrcForDisplay,
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't load the character";
        setError(message);
      }
    }

    void loadCharacter();
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
          <h1>{character.name}</h1>
          <p>
            <strong>Last updated:</strong> {character.timestamp}
          </p>
          <section style={{ marginTop: 24 }}>
            <h2>Description</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {character.description || "No description"}
            </p>
          </section>

          {/* Images linked to this character in the DB (Image.character FK); same resolve helper as scene/idea pages */}
          <section style={{ marginTop: 24 }}>
            <h2>Images for this character</h2>
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
