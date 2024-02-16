import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "./Initialize";

const fetchAllDocuments = async (collectionName) => {
  const collectionRef = collection(db, collectionName);
  const querySnapshot = await getDocs(collectionRef);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export { fetchAllDocuments, checkDuplicateAnnotation };
