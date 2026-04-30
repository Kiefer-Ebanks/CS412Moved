// File: App.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This file is the main file for the application
// It contains the routes for the application and checks if the user is authenticated
// If the user is not authenticated it will take them to the login page

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./api";
import IdeaDetailPage from "./pages/IdeaDetailPage.tsx";
import IdeasPage from "./pages/IdeasPage.tsx";
import CreateIdeaPage from "./pages/CreateIdeaPage.tsx";
import CreateScenePage from "./pages/CreateScenePage.tsx";
import CreateCharacterPage from "./pages/CreateCharacterPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import CharacterDetailPage from "./pages/CharacterDetailPage.tsx";
import ImageDetailPage from "./pages/ImageDetailPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import SceneDetailPage from "./pages/SceneDetailPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default route takes you to the login page */}
        <Route path="/" element={<Navigate to="/login" replace />} /> 

        {/* Route for the login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route for the register page */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Route for the ideas page */}
        <Route
          path="/ideas"
          element={
            <RequireAuth>
              <IdeasPage />
            </RequireAuth>
          }
        />

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

        {/* Route for the Account Update Page to allow users to change their password or delete their account */}
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />

        {/* Route for the idea detail page */}
        <Route
          path="/ideas/:id"
          element={
            <RequireAuth>
              <IdeaDetailPage />
            </RequireAuth>
          }
        />

        {/* Route for the scene detail page */}
        <Route
          path="/scenes/:id"
          element={
            <RequireAuth>
              <SceneDetailPage />
            </RequireAuth>
          }
        />

        {/* Route for the character detail page */}
        <Route
          path="/characters/:id"
          element={
            <RequireAuth>
              <CharacterDetailPage />
            </RequireAuth>
          }
        />

        {/* Route for the image detail page (opened from idea / scene / character pages) */}
        <Route
          path="/images/:id"
          element={
            <RequireAuth>
              <ImageDetailPage />
            </RequireAuth>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
