import "dotenv/config";
import app from "./app.js";
import connectDB from "../configs/mongodb.js";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
