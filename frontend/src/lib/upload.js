const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const uploadApi = {
  uploadToCloudinary: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);

    if (options.folder) {
      formData.append("folder", options.folder);
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error ? `${data?.message}: ${data.error}` : data?.message || "Upload failed");
    }

    return data;
  },
};
