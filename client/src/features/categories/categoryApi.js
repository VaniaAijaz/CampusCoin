import api from "../../core/api";

export const getCategories = async (type) => {
  const { data } = await api.get("/categories", { params: { type } });
  return data;
};

export const createCategory = async (catData) => {
  const { data } = await api.post("/categories", catData);
  return data;
};

export const updateCategory = async (id, catData) => {
  const { data } = await api.put(`/categories/${id}`, catData);
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};
