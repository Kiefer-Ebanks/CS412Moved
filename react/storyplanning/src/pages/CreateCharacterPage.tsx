// File: CreateCharacterPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// Description: A form page to create a character for one idea and maybe tie it to one or more scenes

import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createCharacter, getIdea } from "../api";

type FromState = { from?: string };

function CreateCharacterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;
  const [searchParams] = useSearchParams();
  const sceneIdParam = searchParams.get("sceneId");
  const sceneId = sceneIdParam ? Number.parseInt(sceneIdParam, 10) : NaN;
  const { id: ideaIdParam } = useParams<{ id: string }>();
  const ideaId = ideaIdParam ? Number.parseInt(ideaIdParam, 10) : NaN;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sceneOptions, setSceneOptions] = useState<Array<{ id: number; title: string }>>([]); // list of idea scenes for multi-scene selection
  const [selectedSceneIds, setSelectedSceneIds] = useState<number[]>([]); // selected scene ids for this character
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelTarget = from ?? (Number.isNaN(ideaId) ? "/ideas" : `/ideas/${ideaId}`);

  useEffect(() => {
    // loads scenes for this idea so one character can be linked to multiple scenes
    if (Number.isNaN(ideaId)) {
      return;
    }

    async function loadIdeaScenes() {
      try {
        const idea = (await getIdea(ideaId)) as { scenes?: Array<{ id: number; title: string }> };
        setSceneOptions(idea.scenes ?? []);
      } catch {
        // keep scene options empty if request fails; create flow still works without scene links
        setSceneOptions([]);
      }
    }

    void loadIdeaScenes();
  }, [ideaId]);

  useEffect(() => {
    // if user came from one scene, pre-select it by default
    if (!Number.isNaN(sceneId)) {
      setSelectedSceneIds([sceneId]);
    }
  }, [sceneId]);

  function toggleSceneSelection(scenePk: number) {
    // toggles one scene checkbox on/off in the selected scene list
    setSelectedSceneIds((prev) =>
      prev.includes(scenePk) ? prev.filter((id) => id !== scenePk) : [...prev, scenePk],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (Number.isNaN(ideaId)) {
      setError("Invalid idea id for new character.");
      return;
    }
    if (!trimmedName) {
      setError("Character name is required.");
      return;
    }
    setBusy(true);
    try {
      const created = await createCharacter(ideaId, {
        name: trimmedName,
        description,
        scenes: selectedSceneIds,
      });
      // after creating a character, Back should go back to a scene, but if there isn't one it will go back to the idea
      const preferredSceneId = created.scenes && created.scenes.length > 0 ? created.scenes[0] : created.scene; // get the first scene id from the list of scene ids or the single scene id if there is only one
      const parentTarget = preferredSceneId != null ? `/scenes/${preferredSceneId}` : `/ideas/${created.idea}`; // get the parent target based on the first scene id or the single scene id if there is only one
      navigate(`/characters/${created.id}`, {
        state: { from: parentTarget },
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create character");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to={cancelTarget}>&larr; Cancel and return</Link>
      </p>

      <h1>Create character</h1>
      <p>Name is required. Description is optional.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="character-name">Name</label>
        <input
          id="character-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="character-description">Description (optional)</label>
        <textarea
          id="character-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <fieldset style={{ marginBottom: 12 }}>
          <legend>Associate with scenes (optional)</legend>
          {sceneOptions.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              {sceneOptions.map((scene) => (
                <label key={scene.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedSceneIds.includes(scene.id)}
                    onChange={() => toggleSceneSelection(scene.id)}
                  />
                  <span>{scene.title}</span>
                </label>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#555" }}>No scenes available for this idea yet</p>
          )}
        </fieldset>

        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
          <button type="button" onClick={() => navigate(cancelTarget)} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateCharacterPage;
