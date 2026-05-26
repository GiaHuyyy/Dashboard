import { deleteCloudinaryAsset, uploadBufferToCloudinary } from "./cloudinaryService.js";

export const uploadImageAsset = async (buffer, { folder = "" } = {}) => {
  const result = await uploadBufferToCloudinary(buffer, { folder });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    raw: result,
  };
};

export const deleteImageAsset = (publicId) => deleteCloudinaryAsset(publicId);
