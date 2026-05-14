import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "../configs/mongodb.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
