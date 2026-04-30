// Account settings: change password or delete account (calls storyplanning account API endpoints)

import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword, clearToken, deleteAccount } from "../api";

function AccountPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState("");

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

  return (
    <main style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <p>
        <Link to="/ideas">&larr; Back to ideas</Link>
      </p>

      <h1>Account</h1>
      <p>Update your password or delete your account.</p>

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
