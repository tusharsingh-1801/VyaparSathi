import express from "express";
import cors from "cors";
// Importing "./config/env" first guarantees dotenv.config() (and the env var validation
// inside it) runs before "./routes" is imported — which transitively imports sarvamService,
// so the Sarvam client never initializes before SARVAM_API_KEY has been loaded.
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { warmUpAdvisorConnection } from "./services/aiAdvisorService";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);

  // Fire-and-forget: the first request to Sarvam over a fresh connection is noticeably
  // slower (TLS handshake + connection setup) than subsequent ones on the same keep-alive
  // connection. Warming it up at boot means the AI Advisor's first real user message
  // doesn't pay that cost — keeps every user-facing call comfortably under 5s.
  if (env.sarvamApiKey) {
    warmUpAdvisorConnection()
      .then(() => console.log("[startup] Sarvam AI connection warmed up."))
      .catch((err) => console.warn("[startup] Sarvam AI warm-up failed (non-fatal):", err.message));
  }
});
