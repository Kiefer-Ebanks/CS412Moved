// File: RegisterPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/17/2026
// Form to allow a user to create a new account. It then takes them to the ideas list page

import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // creates a new account and then goes to the all ideas page
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(username, password);
      navigate("/ideas");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
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
        Register
      </h1>
      <p style={{ marginBottom: "1.15em" }}>Create an account for FilmBoard</p>

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
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

export default RegisterPage;
