// File: App.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This file is the main file for the application
// It renders the Routes component, which contains the routes for the application
// It also renders the RequireAuth component, which checks if the user is authenticated
// If the user is not authenticated it will take them to the login page

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./api";
import IdeaDetailPage from "./pages/IdeaDetailPage.tsx";
import IdeasPage from "./pages/IdeasPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";

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

        {/* Route for the idea detail page */}
        <Route
          path="/ideas/:id"
          element={
            <RequireAuth>
              <IdeaDetailPage />
            </RequireAuth>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
