import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000"
});

export const uploadImage = async (file, description = "") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }
    return await API.post("/upload", formData);
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const fetchResults = async () => {
  try {
    return await API.get("/results");
  } catch (error) {
    console.error("Fetch results error:", error);
    throw error;
  }
};

export const fetchResultDetail = async (id) => {
  try {
    return await API.get(`/results/${id}`);
  } catch (error) {
    console.error("Fetch result detail error:", error);
    throw error;
  }
};

export const explainClipSimilarity = async (file, description, threshold = null) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);
    if (threshold !== null) {
      formData.append("threshold", threshold);
    }
    const response = await API.post("/explain", formData);
    console.log("CLIP explanation response:", response.data);
    return response;
  } catch (error) {
    console.error("Explain CLIP similarity error:", error);
    // Log more details for debugging
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    throw error;
  }
};