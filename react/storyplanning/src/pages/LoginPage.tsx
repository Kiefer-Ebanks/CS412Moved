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
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Login</h1>
      <p>Sign in to StoryPlanning.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: 12 }}
        />

        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

export default LoginPage;
