import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "./Initialize";

const fetchAllDocuments = async (collectionName) => {
  const collectionRef = collection(db, collectionName);
  const querySnapshot = await getDocs(collectionRef);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const checkEmailExists = async (email) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email)); // Assuming users have an 'email' field
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty; // Returns true if the email exists, false otherwise
};

const fetchAnnotationsByCampaignId = async (campaignId) => {
  const annotationsRef = collection(db, "annotations"); // Assuming 'annotations' is your collection name
  const q = query(annotationsRef, where("campaignId", "==", campaignId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export { fetchAllDocuments, checkEmailExists, fetchAnnotationsByCampaignId };
