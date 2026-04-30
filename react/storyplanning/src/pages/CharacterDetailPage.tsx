// File: CharacterDetailPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: Character detail from GET /api/characters/:id/ (name, description, nested images). Back navigation restores the prior route via location state.

import { useEffect, useState } from "react";
import {
  clearToken,
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
        </>
      ) : null}
    </main>
  );
}

export default CharacterDetailPage; // export the CharacterDetailPage component
