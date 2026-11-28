
import api from "./api";

// Fetch all readings
export const getReadings = async () => {
  const response = await api.get("/readings");
  return response.data;
};

// Add reading
export const addReading = async (readingData) => {
  const response = await api.post("/readings", readingData);
  return response.data;
};

// Update reading
export const updateReading = async (id, readingData) => {
  const response = await api.put(`/readings/${id}`, readingData);
  return response.data;
};

// Delete reading
export const deleteReading = async (id) => {
  const response = await api.delete(`/readings/${id}`);
  return response.data;
};
