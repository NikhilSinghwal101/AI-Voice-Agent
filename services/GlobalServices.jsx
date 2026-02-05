import axios from "axios";

export const getToken = async () => {
  const res = await axios.post("/api/getToken");

  console.log("getToken API response:", res.data);

  return res.data?.token;
};
