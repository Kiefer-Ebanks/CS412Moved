// File: AccountPage.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/29/2026
// This page allows users to change their password or delete their account
// It also allows the user to logout and navigate back to the login page


import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  changePassword,
  changeUsername,
  clearToken,
  deleteAccount,
  getStoredUsername,
} from "../api";

function AccountPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState(""); // state to store the current password
  const [newPassword, setNewPassword] = useState(""); // state to store the new password
  const [confirmPassword, setConfirmPassword] = useState(""); // state to store the second new password to confirm the new password
  const [pwBusy, setPwBusy] = useState(false); // state to store the password update status
  const [pwMessage, setPwMessage] = useState(""); // state to store the password update message
  const [pwError, setPwError] = useState(""); // state to store any password update errors

  const [newUsername, setNewUsername] = useState(""); // state to store the new username
  const [unameBusy, setUnameBusy] = useState(false); // state to store the username update status
  const [unameMessage, setUnameMessage] = useState(""); // state to store the username update message
  const [unameError, setUnameError] = useState(""); // state to store any username update errors

  const [delBusy, setDelBusy] = useState(false); // state to store the delete busy status
  const [delError, setDelError] = useState(""); // state to store any delete account errors
  const [displayName, setDisplayName] = useState(getStoredUsername() ?? "Account"); // Account name heading text

  async function handleUsernameSubmit(e: FormEvent<HTMLFormElement>) {
    /* changing a user's username without requiring old username */

    e.preventDefault();
    setUnameError("");
    setUnameMessage("");
    const trimmed = newUsername.trim();
    if (!trimmed) {
      setUnameError("Enter a username");
      return;
    }
    setUnameBusy(true);
    try {
      const updated = await changeUsername(trimmed);
      setUnameMessage(`Username updated to ${updated}`); // show the new username in the username update message to let user know the username was updated successfully
      setDisplayName(updated); // show the new username in the account page heading immediately
      setNewUsername("");
    } catch (err) {
      setUnameError(err instanceof Error ? err.message : "Could not update username");
    } finally {
      setUnameBusy(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    /* changing a user's password */

    e.preventDefault(); // prevent the default form submission behavior so we can handle the form submission ourselves
    setPwError(""); // clear any previous error messages
    setPwMessage(""); // clear any previous success messages
    
    // check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setPwBusy(false);
    }
  }

  async function handleDeleteAccount() {
    /* deleting a user's account and all related data */

    // have the user confirm that they want to delete their account and all related data with a confirm dialog pop up
    setDelError("");
    if (
      !window.confirm(
        "Are you sure you want to delete your account permanently? All ideas and related data will be removed. This cannot be undone.",
      )
    ) {
      return;
    }
    setDelBusy(true);
    try {
      await deleteAccount();
      clearToken();
      navigate("/login", { replace: true });
    } catch (err) {
      setDelError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDelBusy(false);
    }
  }

  function handleLogout() {
    // logs out immediately from account settings page and routes user to login
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <main style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to="/ideas">&larr; Back to ideas</Link>
      </p>

      <h1>{displayName}'s Account</h1>
      <p>Update your username and password or delete your account.</p>
      <p style={{ marginTop: 10 }}>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </p>

      <section style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #ddd" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Change username</h2>
        <form onSubmit={handleUsernameSubmit}>
          <label htmlFor="new-username">New username</label>
          <input
            id="new-username"
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
          {unameError ? <p style={{ color: "crimson" }}>{unameError}</p> : null}
          {unameMessage ? <p style={{ color: "green" }}>{unameMessage}</p> : null}
          <button type="submit" disabled={unameBusy}>
            {unameBusy ? "Saving…" : "Update username"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #ddd" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Change password</h2>
        <form onSubmit={handlePasswordSubmit}>
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
          {pwError ? <p style={{ color: "crimson" }}>{pwError}</p> : null}
          {pwMessage ? <p style={{ color: "green" }}>{pwMessage}</p> : null}
          <button type="submit" disabled={pwBusy}>
            {pwBusy ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #ddd" }}>
        <h2 style={{ fontSize: "1.1rem", color: "#8b0000" }}>Delete account</h2>
        <p style={{ fontSize: "0.95rem" }}>
          You must be signed in. Your user and all associated ideas, scenes, characters, and images will
          be removed. You will confirm in the next step.
        </p>
        {delError ? <p style={{ color: "crimson" }}>{delError}</p> : null}
        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={delBusy}
          style={{ background: "#c00", color: "#fff", border: "none", padding: "8px 14px" }}>
          {delBusy ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </main>
  );
}

export default AccountPage;
