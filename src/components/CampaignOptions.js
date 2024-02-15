import "../styles/CampaignOptions.css";
import React, { useState } from "react";
import AsyncSelect from "react-select/async"; // Make sure to have react-select installed

function CampaignOptions() {
  const [view, setView] = useState("options"); // 'join', 'create', or 'options'

  const renderOptionsView = () => (
    <div className="campaign-options">
      <button onClick={() => setView("join")}>Join Campaign</button>
      <button onClick={() => setView("create")}>Create Campaign</button>
    </div>
  );

  const renderJoinView = () => (
    <div className="join-campaign">
      <div className="back-arrow" onClick={() => setView("options")}>
        ←
      </div>
      <input type="text" placeholder="Enter Campaign Code" />
      <button>Confirm</button>
    </div>
  );

  const renderCreateView = () => (
    <div className="create-campaign">
      <div className="back-arrow" onClick={() => setView("options")}>
        ←
      </div>
      <form>
        <label>
          Campaign Name:
          <input type="text" placeholder="Campaign Name" />
        </label>
        <label>Thesaurus:</label>
        <label>
          Permanent Storage:
          <input type="text" placeholder="Storage Link" />
        </label>
        <button type="submit">Create Campaign</button>
      </form>
    </div>
  );

  return (
    <div>
      {view === "options" && renderOptionsView()}
      {view === "join" && renderJoinView()}
      {view === "create" && renderCreateView()}
    </div>
  );
}

export default CampaignOptions;
