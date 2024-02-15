// App.js

import React, { useState, useEffect } from "react";
import Configuration from "./components/Configuration";
import CampaignOptions from "./components/CampaignOptions";
import ContentAnnotator from "./components/ContentAnnotator";

function App() {
  const [username, setUsername] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      setIsConfigured(true);
    }
  }, []);

  const handleUsernameSubmit = (username) => {
    localStorage.setItem("username", username);
    setUsername(username);
    setIsConfigured(true);
  };

  return (
    <div>
      {!isConfigured ? (
        <Configuration onUsernameSubmit={handleUsernameSubmit} />
      ) : (
        <>
          <CampaignOptions />
        </>
      )}
    </div>
  );
}

export default App;
