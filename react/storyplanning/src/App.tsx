// File: App.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This file is the main file for the application
// It contains the routes for the application and checks if the user is authenticated
// If the user is not authenticated it will take them to the login page

import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearToken, getStoredUsername, getToken } from "./api";
import IdeaDetailPage from "./pages/IdeaDetailPage.tsx";
import IdeasPage from "./pages/IdeasPage.tsx";
import CreateIdeaPage from "./pages/CreateIdeaPage.tsx";
import CreateScenePage from "./pages/CreateScenePage.tsx";
import CreateCharacterPage from "./pages/CreateCharacterPage.tsx";
import CreateImageUploadPage from "./pages/CreateImageUploadPage.tsx";
import CreateImageLinkPage from "./pages/CreateImageLinkPage.tsx";
import CreateDrawingPage from "./pages/CreateDrawingPage.tsx";
import DrawingDetailPage from "./pages/DrawingDetailPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import CharacterDetailPage from "./pages/CharacterDetailPage.tsx";
import ImageDetailPage from "./pages/ImageDetailPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import SceneDetailPage from "./pages/SceneDetailPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  // ensures that the user is authenticated before accessing the page
  // otherwise it will redirect them to the login page
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AuthenticatedLayout() {
  // layout component that is used to display the shared top bar with title and account information forall the pages in my app

  const navigate = useNavigate();
  const location = useLocation();
  const username = getStoredUsername();
  const stateFrom = (location.state as { from?: string } | null)?.from;
  const showIdeaDetailBack = /^\/ideas\/\d+$/.test(location.pathname);
  const showSceneDetailBack = /^\/scenes\/\d+$/.test(location.pathname);
  const showCharacterDetailBack = /^\/characters\/\d+$/.test(location.pathname);
  const showAccountBack = location.pathname === "/account";
  const showImageDetailBack = /^\/images\/\d+$/.test(location.pathname);
  const showDrawingDetailBack = /^\/drawings\/\d+$/.test(location.pathname);
  const showHeaderBack =
    showIdeaDetailBack ||
    showSceneDetailBack ||
    showCharacterDetailBack ||
    showAccountBack ||
    showImageDetailBack ||
    showDrawingDetailBack;
  const backLabel = showSceneDetailBack
    ? "\u2190 Back to Idea"
    : showIdeaDetailBack
      ? "\u2190 Back to All Ideas"
      : "\u2190 Back";
  const backTarget = stateFrom ?? "/ideas";
  const accountLinkState = location.pathname === "/account" ? undefined : { from: `${location.pathname}${location.search}` };

  function handleLogout() {
    // clear auth token and route back to login when user logs out from navbar
    clearToken();
    navigate("/login");
  }

  return (
    <>
      {/* Shared top bar for authenticated non-create pages */}
      <header className="app-shell-header">
        <Link to="/ideas" className="app-shell-title-link"> {/* clicking on the filmboard logo links to the ideas page */}
          <h2 className="app-shell-title">FilmBoard</h2>
        </Link>
        <div className="app-shell-right">
          {showHeaderBack ? (
            <Link to={backTarget} className="app-shell-back-link">
              {backLabel}
            </Link>
          ) : null}
          <Link to="/account" state={accountLinkState} className="app-shell-account-link"> {/* Link to the account page */}
            {username ?? "Account"}
          </Link>
          <button type="button" className="app-shell-logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </>
  );
}

function App() {
  // this is the top-level router: each page shares the same header and layout and is protected by the RequireAuth component
  
  return (
    <BrowserRouter>
      <Routes>

        {/* Default route takes you to the login page */}
        <Route path="/" element={<Navigate to="/login" replace />} /> 

        {/* Route for the login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route for the register page */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Route for creating a new idea */}
        <Route
          path="/ideas/new"
          element={
            <RequireAuth>
              <CreateIdeaPage />
            </RequireAuth>
          }
        />

        {/* Route for creating a new scene for a specific idea */}
        <Route
          path="/ideas/:id/scenes/new"
          element={
            <RequireAuth>
              <CreateScenePage />
            </RequireAuth>
          }
        />

        {/* Route for creating a new character for a specific idea */}
        <Route
          path="/ideas/:id/characters/new"
          element={
            <RequireAuth>
              <CreateCharacterPage />
            </RequireAuth>
          }
        />

        {/* Route for adding an uploaded image under a specific idea */}
        <Route
          path="/ideas/:id/images/new/upload"
          element={
            <RequireAuth>
              <CreateImageUploadPage />
            </RequireAuth>
          }
        />

        {/* Route for adding an image by URL under a specific idea */}
        <Route
          path="/ideas/:id/images/new/link"
          element={
            <RequireAuth>
              <CreateImageLinkPage />
            </RequireAuth>
          }
        />

        {/* Route for creating a new drawing for a specific idea */}
        <Route
          path="/ideas/:id/drawings/new"
          element={
            <RequireAuth>
              <CreateDrawingPage />
            </RequireAuth>
          }
        />

        {/* All pages use this shared page header and inherit the layout similar to the base.html template for django page */}
        <Route
          element={
            <RequireAuth>
              <AuthenticatedLayout />
            </RequireAuth>
          }>
          {/* Route for the ideas page */}
          <Route path="/ideas" element={<IdeasPage />} />

          {/* Route for the Account Update Page to allow users to change their password or delete their account */}
          <Route path="/account" element={<AccountPage />} />

          {/* Route for the idea detail page */}
          <Route path="/ideas/:id" element={<IdeaDetailPage />} />

          {/* Route for the scene detail page */}
          <Route path="/scenes/:id" element={<SceneDetailPage />} />

          {/* Route for the character detail page */}
          <Route path="/characters/:id" element={<CharacterDetailPage />} />

          {/* Route for the image detail page */}
          <Route path="/images/:id" element={<ImageDetailPage />} />

          {/* Route for a specific drawing editor page */}
          <Route path="/drawings/:id" element={<DrawingDetailPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
