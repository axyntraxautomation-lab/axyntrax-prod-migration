import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import webhooksRouter from "./routes/webhooks";
import { logger } from "./lib/logger";
import { blocklistGuard, lockdownGuard } from "./middleware/security";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true }));
app.use(cookieParser());
// Capture the raw request body alongside JSON parsing so signed webhooks
// (Meta / WhatsApp) can re-compute their HMAC over the exact bytes Express
// received, rather than over a re-serialised JSON value.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error:
      "Demasiados intentos de autenticación. Espera 15 minutos antes de reintentar.",
  },
});

app.use("/whatsapp", (req, res, next) => {
  req.url = "/webhooks/whatsapp" + (req.url === "/" ? "" : req.url);
  webhooksRouter(req, res, next);
});
app.use("/facebook", (req, res, next) => {
  req.url = "/webhooks/meta" + (req.url === "/" ? "" : req.url);
  webhooksRouter(req, res, next);
});
app.use("/instagram", (req, res, next) => {
  req.url = "/webhooks/meta" + (req.url === "/" ? "" : req.url);
  webhooksRouter(req, res, next);
});

const emailOtpLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 6,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error:
      "Demasiadas solicitudes de código por correo. Esperá una hora o usá tu app autenticadora.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/2fa/verify", authLimiter);
app.use("/api/auth/2fa/login", authLimiter);
app.use("/api/auth/2fa/email/request", emailOtpLimiter);

app.use("/api", generalLimiter);
app.use("/api", blocklistGuard);
app.use("/api", lockdownGuard);
app.use("/api", router);

export default app;
