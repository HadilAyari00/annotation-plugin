import "../styles/CampaignOptions.css";
import React, { useState, useEffect } from "react";
import { components } from "react-select";
import AsyncSelect from "react-select/async";
import thesaurusData from "../data/thesaurus.json";
import { addCampaign } from "../Server/addDoc";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Server/Initialize";

const CampaignOptions = ({ setActiveCampaign, onCampaignSelect }) => {
  const [view, setView] = useState("options");
  const [selectedThesauri, setSelectedThesauri] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");

  const [userCampaigns, setUserCampaigns] = useState([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const username = localStorage.getItem("username");
      const campaignsAsAdmin = query(
        collection(db, "campaigns"),
        where("admins", "array-contains", username)
      );
      const campaignsAsParticipant = query(
        collection(db, "campaigns"),
        where("participants", "array-contains", username)
      );

      try {
        const [adminSnapshot, participantSnapshot] = await Promise.all([
          getDocs(campaignsAsAdmin),
          getDocs(campaignsAsParticipant),
        ]);

        const adminCampaigns = adminSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const participantCampaigns = participantSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const combinedCampaigns = [
          ...adminCampaigns,
          ...participantCampaigns.filter(
            (campaign) =>
              !adminCampaigns.find(
                (adminCampaign) => adminCampaign.id === campaign.id
              )
          ),
        ];

        setUserCampaigns(combinedCampaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
    console.log("Fetched campaigns:", userCampaigns);
  }, []);

  const renderCampaignsList = () => (
    <div className="campaigns-list">
      {userCampaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="campaign"
          onClick={() => handleCampaignClick(campaign)}
        >
          {campaign.name}
        </div>
      ))}
    </div>
  );
  const handleCampaignClick = (campaign) => {
    console.log("Selected campaign:", campaign);
    if (!campaign) {
      console.error("Attempted to select an undefined campaign");
      return;
    }
    setActiveCampaign(campaign);
    onCampaignSelect(campaign);
  };

  const handleThesaurusChange = (thesaurusName) => {
    setSelectedThesauri((prevSelected) => {
      if (prevSelected.includes(thesaurusName)) {
        return prevSelected.filter((name) => name !== thesaurusName);
      } else {
        return [...prevSelected, thesaurusName];
      }
    });
  };

  const renderThesaurusOptions = () => (
    <div className="thesaurus-dropdown">
      {thesaurusData.map((thesaurus, index) => (
        <label key={index}>
          <input
            type="checkbox"
            checked={selectedThesauri.includes(thesaurus.name)}
            onChange={() => handleThesaurusChange(thesaurus.name)}
          />
          {thesaurus.name}
        </label>
      ))}
    </div>
  );

  const renderOptionsView = () => (
    <div className="campaign-options">
      <button onClick={() => setView("join")}>Join Campaign</button>
      <button onClick={() => setView("create")}>Create Campaign</button>
      {renderCampaignsList()}
    </div>
  );

  const renderJoinView = () => (
    <div className="join-campaign">
      <div className="back-arrow" onClick={() => setView("options")}>
        ←
      </div>
      <input type="text" placeholder="Enter Campaign Name" />

      <input type="text" placeholder="Enter Campaign Code" />
      <button>Confirm</button>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!campaignName || !campaignCode || selectedThesauri.length === 0) {
      alert("Please fill in all fields and select at least one thesaurus.");
      return;
    }

    const username = localStorage.getItem("username");
    const campaignData = {
      name: campaignName,
      code: campaignCode,
      dateCreated: new Date(),
      admins: [username],
      participants: [],
      selectedThesauri: selectedThesauri,
    };

    try {
      const docRef = await addCampaign(campaignData);
      alert("Campaign created successfully!");

      setUserCampaigns((prevCampaigns) => [
        ...prevCampaigns,
        { ...campaignData, id: docRef.id },
      ]);

      setCampaignName("");
      setCampaignCode("");
      setSelectedThesauri([]);
      setView("options");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign.");
    }
  };

  const renderCreateView = () => (
    <div className="create-campaign">
      <div className="back-arrow" onClick={() => setView("options")}>
        ←
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Campaign Name:
          <input
            type="text"
            placeholder="Campaign Name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </label>
        <label>
          Campaign Code:
          <input
            type="text"
            placeholder="Unique Campaign Code"
            value={campaignCode}
            onChange={(e) => setCampaignCode(e.target.value)}
          />
        </label>
        <label>
          Thesaurus:
          {renderThesaurusOptions()}
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
};

export default CampaignOptions;
