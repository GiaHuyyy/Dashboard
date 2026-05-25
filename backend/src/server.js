import "dotenv/config";
import app from "./app.js";
import connectDB from "../configs/mongodb.js";
import { seedSuperAdmin } from "./services/superAdminSeedService.js";

const PORT = process.env.PORT || 5000;

await connectDB();
await seedSuperAdmin();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Server đang hoạt động!');
});
