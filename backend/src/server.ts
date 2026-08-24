import express from "express";
import cors from "cors";
// Importing "./config/env" first guarantees dotenv.config() (and the env var validation
// inside it) runs before "./routes" is imported — which transitively imports sarvamService,
// so the Sarvam client never initializes before SARVAM_API_KEY has been loaded.
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
});
