import { collection, addDoc } from "firebase/firestore";
import { db } from "./Initialize";
// Add a new user
const addUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, "users"), userData);
    console.log("Document written with ID: ", docRef.id);
    return docRef;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

// Add a new campaign
const addCampaign = async (campaignData) => {
  try {
    const docRef = await addDoc(collection(db, "campaigns"), campaignData);
    console.log("Document written with ID: ", docRef.id);
    return docRef;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

// Add a new annotation
const addAnnotation = async (annotationData) => {
  // Sanitize data to replace `undefined` values with a default string
  const sanitizedData = Object.keys(annotationData).reduce((acc, key) => {
    acc[key] =
      annotationData[key] === undefined
        ? "link not found"
        : annotationData[key];
    return acc;
  }, {});

  try {
    const docRef = await addDoc(collection(db, "annotations"), sanitizedData);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export { addUser, addCampaign, addAnnotation };
