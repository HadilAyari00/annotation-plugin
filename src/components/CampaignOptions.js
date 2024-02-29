import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { faUserPlus, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import thesaurusData from "../data/thesaurus.json";
import { addCampaign } from "../Server/addDoc";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Server/Initialize";
import {
  updateCampaignParticipants,
  updateCampaignAdmins,
} from "../Server/updateDoc";
import { checkEmailExists } from "../Server/readDoc";
import { getAuth, signOut } from "firebase/auth";
import Modal from "./Modal";
import "../styles/CampaignOptions.css";

const CampaignOptions = ({
  setActiveCampaign,
  onCampaignSelect,
  username,
  onLogout,
}) => {
  const [view, setView] = useState("options");
  const [selectedThesauri, setSelectedThesauri] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");

  const [userCampaigns, setUserCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [emailToAdd, setEmailToAdd] = useState("");
  const [roleToAdd, setRoleToAdd] = useState("participant");
  const [modalStyle, setModalStyle] = useState({});

  useEffect(() => {
    if (username) {
      fetchCampaigns();
    }
  }, [username]);

  const fetchCampaigns = async () => {
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

  const renderCampaignsList = () => (
    <div className="campaigns-list">
      {" "}
      {userCampaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="campaign"
          onClick={() => handleCampaignClick(campaign)}
        >
          {" "}
          <span>{campaign.name}</span>
          {campaign.admins.includes(username) && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent click from bubbling up
                openModal(campaign, e);
              }}
              className="gear-icon-button"
            >
              ⚙️
            </button>
          )}
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
      <button onClick={() => setView("join")} className="campaign-button">
        <FontAwesomeIcon icon={faUserPlus} /> Join Campaign
      </button>
      <button onClick={() => setView("create")} className="campaign-button">
        <FontAwesomeIcon icon={faPlusCircle} /> Create Campaign
      </button>
      {renderCampaignsList()}
    </div>
  );

  const renderJoinView = () => (
    <div className="join-campaign">
      <div className="back-arrow" onClick={() => setView("options")}>
        ←
      </div>
      <input
        type="text"
        className="campaign-input"
        placeholder="Enter Campaign Code"
        value={campaignCode}
        onChange={(e) => setCampaignCode(e.target.value)}
      />
      <button onClick={handleJoinCampaign} className="campaign-button">
        Join Campaign
      </button>
    </div>
  );

  const handleJoinCampaign = async () => {
    if (!campaignCode.trim()) {
      alert("Please enter a campaign code.");
      return;
    }

    try {
      const campaignQuery = query(
        collection(db, "campaigns"),
        where("code", "==", campaignCode.trim())
      );
      const querySnapshot = await getDocs(campaignQuery);

      if (querySnapshot.empty) {
        alert("No campaign found with this code.");
        return;
      }

      const campaignDoc = querySnapshot.docs[0];
      const campaignId = campaignDoc.id;

      await updateCampaignParticipants(campaignId, username);

      alert(`Joined campaign: ${campaignDoc.data().name}`);
      setView("options");

      fetchCampaigns();
    } catch (error) {
      console.error("Error joining campaign:", error);
      alert("Failed to join campaign.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!campaignName || selectedThesauri.length === 0) {
      alert("Please fill in all fields and select at least one thesaurus.");
      return;
    }

    const generatedCode = generateUniqueCode();

    const username = localStorage.getItem("username");
    const campaignData = {
      name: campaignName,
      code: generatedCode,
      dateCreated: new Date(),
      admins: [username],
      participants: [],
      selectedThesauri: selectedThesauri,
    };

    try {
      const docRef = await addCampaign(campaignData);
      alert(
        `Campaign created successfully! Invite others using this code: ${generatedCode}`
      );

      setUserCampaigns((prevCampaigns) => [
        ...prevCampaigns,
        { ...campaignData, id: docRef.id },
      ]);

      setCampaignName("");
      setSelectedThesauri([]);
      setView("options");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign.");
    }
  };

  const generateUniqueCode = () => {
    return `CMP-${new Date().getTime()}-${Math.floor(Math.random() * 10000)}`;
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
            className="campaign-input"
            placeholder="Campaign Name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </label>
        <label>Thesaurus:{renderThesaurusOptions()}</label>
        <button type="submit" className="campaign-button">
          Create Campaign
        </button>
      </form>
    </div>
  );

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("User signed out successfully");
        onLogout();
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  const openModal = (campaign, e) => {
    if (showModal && selectedCampaign?.id === campaign.id) {
      closeModal();
    } else {
      const modalPosition = { top: e.clientY, left: e.clientX };
      setModalStyle(modalPosition);
      setSelectedCampaign(campaign);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    const emailExists = await checkEmailExists(emailToAdd);

    if (!emailExists) {
      alert(
        "The email does not exist in the system. Please make sure the user has an account."
      );
      return;
    }

    if (
      selectedCampaign.admins.includes(emailToAdd) ||
      selectedCampaign.participants.includes(emailToAdd)
    ) {
      alert(
        `The email is already a ${
          selectedCampaign.admins.includes(emailToAdd) ? "admin" : "participant"
        } of this campaign.`
      );
      return;
    }

    if (roleToAdd === "admin") {
      await updateCampaignAdmins(selectedCampaign.id, emailToAdd);
      alert("Admin added successfully.");
    } else {
      await updateCampaignParticipants(selectedCampaign.id, emailToAdd);
      alert("Participant added successfully.");
    }

    closeModal();
    fetchCampaigns();
  };

  const handleEmailChange = (e) => {
    setEmailToAdd(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRoleToAdd(e.target.value);
  };

  return (
    <div className="campaign-container">
      {" "}
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <button onClick={handleLogout} className="logout-button">
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>
      {view === "options" && renderOptionsView()}
      {view === "join" && renderJoinView()}
      {view === "create" && renderCreateView()}
      {showModal && (
        <Modal onClose={closeModal} style={modalStyle}>
          <h4>Campaign Code: {selectedCampaign?.code}</h4>
          <form onSubmit={handleAddUserSubmit}>
            <label>
              Email to Add:
              <input
                type="email"
                className="campaign-input"
                value={emailToAdd}
                onChange={handleEmailChange}
                required
              />
            </label>
            <div>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={roleToAdd === "admin"}
                  onChange={handleRoleChange}
                />
                Admin
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="participant"
                  checked={roleToAdd === "participant"}
                  onChange={handleRoleChange}
                />
                Participant
              </label>
            </div>
            <button type="submit" className="campaign-button">
              Add User
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CampaignOptions;
