import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { addUser } from "../Server/addDoc";
import "../styles/Configuration.css";

function Configuration({ onUsernameSubmit }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [error, setError] = useState("");

  const auth = getAuth();

  const handleAuth = (e) => {
    e.preventDefault();
    if (isLogin) {
      // Login process
      signInWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
          if (userCredential.user.emailVerified) {
            onUsernameSubmit(username);
          } else {
            setError("Please verify your email before logging in.");
          }
        })
        .catch((error) => {
          setError(`Failed to log in: ${error.message}`);
        });
    } else {
      // Signup process
      createUserWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
          sendEmailVerification(userCredential.user).then(() => {
            alert(
              "Validation email sent. Please validate your account before trying again."
            );
            // Add user data to Firestore only on signup
            addUser({ email: username, uid: userCredential.user.uid });
          });
        })
        .catch((error) => {
          setError(`Failed to sign up: ${error.message}`);
        });
    }
  };

  const handlePasswordReset = () => {
    if (!username) {
      setError("Please enter your email address to reset your password.");
      return;
    }

    sendPasswordResetEmail(auth, username)
      .then(() => {
        alert("Password reset email sent. Please check your inbox.");
      })
      .catch((error) => {
        setError(`Error sending password reset email: ${error.message}`);
      });
  };

  return (
    <div className="configuration-container">
      <form onSubmit={handleAuth} className="configuration-form">
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="auth-button">
          {isLogin ? "Login" : "Sign Up"}
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="toggle-button"
        >
          Switch to {isLogin ? "Sign Up" : "Login"}
        </button>
        {isLogin && (
          <button
            type="button"
            onClick={handlePasswordReset}
            className="reset-button"
          >
            Forgot Password?
          </button>
        )}
      </form>
    </div>
  );
}

export default Configuration;
