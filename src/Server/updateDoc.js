import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./Initialize";

const updateCampaignParticipants = async (campaignId, username) => {
  const campaignRef = doc(db, "campaigns", campaignId);

  try {
    await updateDoc(campaignRef, {
      participants: arrayUnion(username),
    });
    console.log(`User ${username} added to campaign ${campaignId}`);
  } catch (e) {
    console.error("Error updating campaign participants: ", e);
    throw e;
  }
};

const updateCampaignAdmins = async (campaignId, email) => {
  const campaignRef = doc(db, "campaigns", campaignId);

  try {
    await updateDoc(campaignRef, {
      admins: arrayUnion(email),
    });
    console.log(`Admin ${email} added to campaign ${campaignId}`);
  } catch (e) {
    console.error("Error updating campaign admins: ", e);
    throw e;
  }
};

export { updateCampaignParticipants, updateCampaignAdmins };
