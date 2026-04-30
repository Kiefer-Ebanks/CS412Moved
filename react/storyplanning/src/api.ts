// File: api.ts
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// Description: API helpers for storyplanning React frontend.

// Base URL for Django API, will also use the VITE_API_BASE_URL when I deploy it
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/storyplanning";

export function resolveImageSrcForDisplay(
  /*
  * Turns backend image strings into a valid http urls external links
  * keeps normal http urls the same but adds http or https to media path images
  * so the browser can load the image files uploaded to the backend
  */
  url: string | undefined | null,
): string | undefined {
  if (url == null || url === "") {
    return undefined;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    const base = new URL(API_BASE); // create a new URL object with the API base URL
    return `${base.protocol}//${base.host}${url}`;
  }
  return url;
}

// localStorage key used to persist auth token, this is used to store the token in the browser's localStorage
const TOKEN_KEY = "storyplanning_token";

// localStorage key for username so pages can display account name without an extra API call
const USERNAME_KEY = "storyplanning_username";

// this is the shape of the response from the auth endpoints
type AuthResponse = {
  token: string;
  user_id: number;
  username: string;
};

/* Returns saved token, or null if user is logged out */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/* Saves token after login or register succeeds */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/* Clears token from storage for logout */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

/* Returns the saved username from localStorage */
export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

/* Sends login credentials and stores returned token */
export async function login(username: string, password: string): Promise<AuthResponse> {
  
  // call the token login endpoint to send the login credentials and store the returned token
  const response = await fetch(`${API_BASE}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, password: password }),
  });

  // Parse JSON body once to get the data from the response
  const data = await response.json();
  if (!response.ok) {
    const message = data && data.error ? data.error : "Login failed";
    throw new Error(message);
  }

  // ensure that the token is returned
  if (!data || !data.token) {
    throw new Error("No token returned by API");
  }

  // Save token for future authenticated requests
  setToken(data.token);
  if (typeof data.username === "string") {
    localStorage.setItem(USERNAME_KEY, data.username);
  }

  return data as AuthResponse;
}

/*
 * Creates a user account and stores returned token
 */
export async function register(
  username: string,
  password: string,
): Promise<AuthResponse> {

  // Call token registration endpoint to send the registration credentials and store the returned token
  const response = await fetch(`${API_BASE}/api/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, password: password }),
  });

  // Parse JSON body once to get the data from the response
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  // ensure that the token is returned
  if (!data || !data.token) {
    throw new Error("No token returned by API");
  }

  // Save token for future authenticated requests
  setToken(data.token);
  if (typeof data.username === "string") {
    localStorage.setItem(USERNAME_KEY, data.username);
  }
  return data as AuthResponse;
}

export async function changePassword(
  /* Changing a user's password, but it requires the current password to be entered first */

  currentPassword: string,
  newPassword: string,
): Promise<void> {

  // Call the change password endpoint to send the current password and new password
  const response = await authFetch("/api/account/password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // response.json() fails when the body is empty or not JSON so we can just leave data {} and use the generic message below
  }
  if (!response.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : typeof data.detail === "string"
          ? data.detail
          : "Could not update password";
    throw new Error(msg);
  }
}

export async function changeUsername(newUsername: string): Promise<string> {
  /* Changing the authenticated user's username*/

  const response = await authFetch("/api/account/username/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_username: newUsername }),
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // response.json() fails when the body is empty or not JSON so we can just leave data {} and use the generic message below
  }
  if (!response.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : typeof data.detail === "string"
          ? data.detail
          : "Could not update username";
    throw new Error(msg);
  }
  
  // ensure that the username is returned
  if (typeof data.username !== "string") {
    throw new Error("Username update response was missing username");
  }
  // keep stored username in sync after update so the account page heading with the account name updates immediately
  localStorage.setItem(USERNAME_KEY, data.username);
  return data.username;
}

export async function deleteAccount(): Promise<void> {
  /* Deleting a user's account and all related data */

  // Call the delete account endpoint to delete the user's account and all related data
  const response = await authFetch("/api/account/", {
    method: "DELETE",
  });
  if (response.ok) {
    return;
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // response.json() fails when the body is empty or not JSON so we can just leave data {} and use the generic message below
  }
  const msg =
    typeof data.error === "string"
      ? data.error
      : "Could not delete account";
  throw new Error(msg);
}

/*
 * Fetch wrapper that attaches Authorization header when a token exists
 */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  // Pull token from localStorage.
  const token = getToken();

  // Build headers from caller headers
  const initObject = init ? init : {};
  const headers = new Headers(initObject.headers ? initObject.headers : undefined);

  // Add token header for protected endpoints to ensure that the user is authenticated
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  // Build RequestInit to ensure that the request is authenticated
  const requestInit: RequestInit = {
    method: initObject.method,
    body: initObject.body,
    cache: initObject.cache,
    credentials: initObject.credentials,
    integrity: initObject.integrity,
    keepalive: initObject.keepalive,
    mode: initObject.mode,
    redirect: initObject.redirect,
    referrer: initObject.referrer,
    referrerPolicy: initObject.referrerPolicy,
    signal: initObject.signal,
    window: initObject.window,
    headers: headers,
  };

  // Make authenticated request to the API
  return fetch(`${API_BASE}${path}`, requestInit);
}

// Shape of one row from the paginated ideas list API
export type IdeaListItem = {
  id: number;
  title: string;
  storyboard: string;
  timestamp: string;
  user: number;
};

// character object from SceneSerializer
export type SceneCharacterRow = {
  id: number;
  name: string;
  description?: string;
  timestamp: string;
  idea: number;
  scene: number | null;
  scenes?: number[];
};

// image model shape from ImageSerializer
export type ImageRow = {
  id: number;
  image?: string;
  image_url?: string;
  image_file?: string | null;
  description?: string;
  timestamp: string;
  scene?: number | null;
  character?: number | null;
  idea: number;
  idea_title?: string;
  scene_title?: string | null;
  character_name?: string | null;
};

// shape of the scene detail response from scenes endpoint
export type SceneDetailResponse = {
  id: number;
  title: string;
  outline: string;
  script: string;
  timestamp: string;
  idea: number;
  characters: SceneCharacterRow[];
  images: ImageRow[];
};

// shape of the character model that we get from the backend charactersendpoint with images linked to the character
export type CharacterDetailResponse = {
  id: number;
  name: string;
  description?: string;
  timestamp: string;
  idea: number;
  scene: number | null;
  scenes?: number[];
  images: ImageRow[];
};

// Paginated response for the ideas list from /api/ideas/ 
export type IdeasListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: IdeaListItem[];
};


export async function getIdeas(): Promise<IdeasListResponse> {
  /* Returns ideas visible to the current user */

  const response = await authFetch("/api/ideas/"); // hit the ideas endpoint to get the ideas
  if (!response.ok) {
    throw new Error("Couldn't get the ideas from the API");
  }

  // Return the JSON body to get the data from the response and return the ideas
  return response.json() as Promise<IdeasListResponse>;
}

export async function updateIdeaTitle(id: number, title: string): Promise<IdeaListItem> {
  /* Updates only an idea title via a PATCH request to the ideas endpoint */

  const response = await authFetch(`/api/ideas/${id}/`, { // call the ideas endpoint to update the idea title
    method: "PATCH", // use the PATCH method to update the idea title
    headers: { "Content-Type": "application/json" }, // set the content type to application/json
    body: JSON.stringify({ title }), // send the new title in the request body
  });
  if (!response.ok) {
    throw new Error("Could not update title");
  }
  return response.json() as Promise<IdeaListItem>; // return the updated idea title
}

export async function updateSceneTitle(id: number, title: string): Promise<SceneDetailResponse> {
  /* Updates only a scene title via a PATCH request to the scenes endpoint */

  const response = await authFetch(`/api/scenes/${id}/`, { // call the scenes endpoint to update the scene title
    method: "PATCH", // use the PATCH method to update the scene title
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }), // send the new title in the request body
  });
  if (!response.ok) {
    throw new Error("Could not update scene title");
  }
  return response.json() as Promise<SceneDetailResponse>; // return the updated scene title
}

export async function updateSceneContent(
  id: number,
  payload: { outline?: string; script?: string },
): Promise<SceneDetailResponse> {
  /* Updates scene outline/script fields via a PATCH request to the scenes endpoint */

  const response = await authFetch(`/api/scenes/${id}/`, { // call the scenes endpoint to update the scene content
    method: "PATCH", // use the PATCH method to update the scene content
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // send the new content in the request body
  });
  if (!response.ok) {
    throw new Error("Could not update scene content");
  }
  return response.json() as Promise<SceneDetailResponse>;
}

export async function updateIdeaStoryboard(id: number, storyboard: string): Promise<IdeaListItem> {
  /* Updates only storyboard text using a PATCH request to the ideas endpoint */

  const response = await authFetch(`/api/ideas/${id}/`, { // call the ideas endpoint to update the storyboard
    method: "PATCH", // use the PATCH method to update the storyboard
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyboard }),
  });
  if (!response.ok) {
    throw new Error("Could not update storyboard");
  }
  return response.json() as Promise<IdeaListItem>;
}

export async function createIdea(title: string, storyboard = ""): Promise<IdeaListItem> {
  /* Creates a new idea and returns the created idea */

  const response = await authFetch("/api/ideas/", { // call the ideas endpoint to create a new idea
    method: "POST", // use the POST method to create a new idea
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, storyboard }), // send the new idea title and storyboard in the request body since those are the only fields that can be creatd
  });
  if (!response.ok) {
    throw new Error("Could not create idea");
  }
  return response.json() as Promise<IdeaListItem>;
}

export async function createScene(
  ideaId: number,
  payload: { title: string; outline?: string; script?: string },
): Promise<SceneDetailResponse> {
  /* Creates a scene for one idea using a POST request to the ideas endpoint */

  const response = await authFetch(`/api/ideas/${ideaId}/scenes/`, { // call the ideas endpoint to create a new scene
    method: "POST", // use the POST method to create a new scene
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // send the new scene data in the request body
  });
  if (!response.ok) {
    throw new Error("Could not create scene");
  }
  return response.json() as Promise<SceneDetailResponse>;
}

// shape of the character create response from the backend characters endpoint
export type CharacterCreateResponse = {
  id: number;
  name: string;
  description?: string;
  timestamp: string;
  idea: number;
  scene: number | null;
  scenes?: number[];
  images: ImageRow[];
};

export async function createCharacter(
  ideaId: number,
  payload: { name: string; description?: string; scenes?: number[]; scene?: number | null },
): Promise<CharacterCreateResponse> {
  /* Creates a character for one idea and potentially links it to one or more scenes */

  const response = await authFetch(`/api/ideas/${ideaId}/characters/`, { // call the ideas endpoint to create a new character
    method: "POST", // use the POST method to create a new character
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // send the new character data in the request body
  });
  if (!response.ok) {
    throw new Error("Could not create character");
  }
  return response.json() as Promise<CharacterCreateResponse>;
}

export async function createImageUpload(
  ideaId: number,
  payload: { file: File; description?: string; scene?: number | null; character?: number | null },
): Promise<ImageRow> {

  /* Creates an image by file upload for one idea and optionally links it to a scene or character */

  const form = new FormData();
  form.append("image_file", payload.file);
  form.append("description", payload.description ?? "");
  if (payload.scene != null) {
    form.append("scene", String(payload.scene));
  }
  if (payload.character != null) {
    form.append("character", String(payload.character));
  }

  const response = await authFetch(`/api/ideas/${ideaId}/images/`, {
    method: "POST", // use the POST method to create a new image
    // we don't need to set the Content-Type header manually for multipart/form-data requests because the browser handles it automatically
    body: form, // send the new image data in the request body
  });
  if (!response.ok) {
    throw new Error("Could not upload image");
  }
  return response.json() as Promise<ImageRow>; // return the created image data from the response
}

export async function createImageLink(
  ideaId: number,
  payload: { image_url: string; description?: string; scene?: number | null; character?: number | null },
): Promise<ImageRow> {
  /* Creates an image by URL and optionally links it to a scene or character */

  const response = await authFetch(`/api/ideas/${ideaId}/images/`, { // call the ideas endpoint to create a new image
    method: "POST", // use the POST method to create a new image
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload), // send the new image data in the request body
  });
  if (!response.ok) {
    throw new Error("Could not add image link");
  }
  return response.json() as Promise<ImageRow>; // return the created image data from the response
}

export async function deleteIdea(id: number): Promise<void> {
  /* Deletes an idea and the backend cascades the delete to all related scenes, characters, and images*/

  const response = await authFetch(`/api/ideas/${id}/`, { // call the ideas endpoint to delete the idea
    method: "DELETE", // use the DELETE method to delete the idea
  });
  if (response.ok) { // if the idea was deleted successfully return nothing
    return;
  }
  throw new Error("Could not delete idea");
}

export async function deleteScene(id: number): Promise<void> {
  /* Deletes a scene and the backend cascades the delete to remove all related images and characters */

  const response = await authFetch(`/api/scenes/${id}/`, { // call the scenes endpoint to delete the scene
    method: "DELETE", // use the DELETE method to delete the scene
  });
  if (response.ok) {
    return;
  }
  throw new Error("Could not delete scene");
}

export async function deleteCharacter(id: number): Promise<void> {
  /* Deletes a character and backend cascades the delete to remove all related images */

  const response = await authFetch(`/api/characters/${id}/`, { // call the characters endpoint to delete the character
    method: "DELETE", // use the DELETE method to delete the character
  });
  if (response.ok) {
    return;
  }
  throw new Error("Could not delete character");
}

export async function updateCharacterName(id: number, name: string): Promise<CharacterCreateResponse> {
  /* Updates only a character name via PATCH /api/characters/:id/ */

  const response = await authFetch(`/api/characters/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("Could not update character name");
  }
  return response.json() as Promise<CharacterCreateResponse>;
}

export async function updateCharacterDescription(
  id: number,
  description: string,
): Promise<CharacterCreateResponse> {
  /* Updates only character description via PATCH /api/characters/:id/ */

  const response = await authFetch(`/api/characters/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) {
    throw new Error("Could not update character description");
  }
  return response.json() as Promise<CharacterCreateResponse>;
}

export async function updateCharacterScenes(
  id: number,
  scenes: number[],
): Promise<CharacterCreateResponse> {
  /* Updates the full set of scene affiliations for one character */

  const response = await authFetch(`/api/characters/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenes }),
  });
  if (!response.ok) {
    throw new Error("Could not update character scenes");
  }
  return response.json() as Promise<CharacterCreateResponse>;
}

export async function updateImageDescription(
  id: number,
  description: string,
): Promise<ImageDetailResponse> {
  /* Updates only image description via a PATCH request to the images endpoint */

  const response = await authFetch(`/api/images/${id}/`, { // call the images endpoint to update the image description
    method: "PATCH", // use the PATCH method to update the image description
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }), // send the new description in the request body
  });
  if (!response.ok) {
    throw new Error("Could not update image description");
  }
  return response.json() as Promise<ImageDetailResponse>;
}

export async function deleteImage(id: number): Promise<void> {
  /* Deletes one image row by id */

  const response = await authFetch(`/api/images/${id}/`, { // call the images endpoint to delete the image
    method: "DELETE",
  });
  if (response.ok) {
    return;
  }
  throw new Error("Could not delete image");
}


export async function getIdea(id: number): Promise<unknown> {
  /* Returns one idea with the attached scenes, characters, and images */

  const response = await authFetch(`/api/ideas/${id}/`); // hit the ideas endpoint to get the idea
  if (response.status === 404) {
    throw new Error("Idea not found");
  }
  if (!response.ok) {
    throw new Error("Couldn't get the idea from the API");
  }
  return response.json();
}

export async function getScene(id: number): Promise<SceneDetailResponse> {
  /* Returns one scene with attached characters and images */

  const response = await authFetch(`/api/scenes/${id}/`); // hit the scenes endpoint to get the scene
  if (response.status === 404) {
    throw new Error("Scene not found");
  }
  if (!response.ok) {
    throw new Error("Couldn't get the scene from the API");
  }
  return response.json() as Promise<SceneDetailResponse>;
}

export async function getCharacter(id: number): Promise<CharacterDetailResponse> {
  /* Returns one character */

  const response = await authFetch(`/api/characters/${id}/`); // fetches from the characters endpoint to get the character
  if (response.status === 404) {
    throw new Error("Character not found");
  }
  if (!response.ok) {
    throw new Error("Couldn't get the character from the API");
  }
  return response.json() as Promise<CharacterDetailResponse>;
}

// shape of the image detail response from the backend images endpoint
export type ImageDetailResponse = ImageRow;

export async function getImage(id: number): Promise<ImageDetailResponse> {
  /* Returns one image row for the image detail page */

  const response = await authFetch(`/api/images/${id}/`); // fetches from the images endpoint to get the image
  
  if (response.status === 404) {
    throw new Error("Image not found");
  }
  if (!response.ok) {
    throw new Error("Couldn't get the image from the API");
  }
  return response.json() as Promise<ImageDetailResponse>;
}
