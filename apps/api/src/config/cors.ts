import { type CorsOptions } from "cors";
import env from "./env.js";

const allowedOrigins = [env.CLIENT_ORIGIN];

console.log(`CORS configured for Client Origin >> ${env.CLIENT_ORIGIN}`);

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

export default corsOptions;
