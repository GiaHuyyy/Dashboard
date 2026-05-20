import SystemCategory from "../models/SystemCategory.js";

export const getActiveCategoryNames = async (type) => {
  const items = await SystemCategory.find({
    type,
    isDeleted: false,
    isActive: true,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("name")
    .lean();

  return items.map((item) => item.name);
};
