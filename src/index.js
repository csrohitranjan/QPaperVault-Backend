import dotenv from "dotenv";
dotenv.config();
import app from "./aap.js";
import connectDB from "./db/dbConnection.js";

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server os Runiing at ${process.env.PORT}`);
  });
  app.on("error", (error) => {
    console.log("ERROR: ", error);
    throw error;
  });
});
