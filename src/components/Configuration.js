import "../styles/Configuration.css";

import React, { useState } from "react";

function Configuration({ onUsernameSubmit }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      onUsernameSubmit(username);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Configuration;
