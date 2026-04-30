// File: LoginPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// This page is the login page for the application
// It allows the user to login to the application or go to the register page

import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";

function LoginPage() {
  
  const navigate = useNavigate(); // using the useNavigate hook to navigate to the ideas page
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // state to store the password
  const [loading, setLoading] = useState(false); // state to store the loading state
  const [error, setError] = useState(""); // state to store any errors

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/ideas");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 460,
        margin: "clamp(3.75rem, 14vh, 9rem) auto 3rem",
        padding: "0 1.1rem",
        fontSize: "1.0625rem",
      }}>
      <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 2.5rem)", margin: "0 0 0.3em", lineHeight: 1.15 }}>
        Login
      </h1>
      <p style={{ marginBottom: "1.15em" }}>Sign in to FilmBoard</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            marginBottom: 14,
            fontSize: "1.0625rem",
            padding: "11px 14px",
            boxSizing: "border-box",
          }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            marginBottom: 14,
            fontSize: "1.0625rem",
            padding: "11px 14px",
            boxSizing: "border-box",
          }}
        />

        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <button type="submit" disabled={loading} style={{ fontSize: "1.0625rem", padding: "11px 22px", marginTop: 2 }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

export default LoginPage;
