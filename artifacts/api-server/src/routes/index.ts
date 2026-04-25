import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import twofaRouter from "./twofa";
import usersRouter from "./users";
import clientsRouter from "./clients";
import licensesRouter from "./licenses";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import conversationsRouter from "./conversations";
import webhooksRouter from "./webhooks";
import gmailRouter from "./gmail";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(twofaRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(licensesRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(conversationsRouter);
router.use(webhooksRouter);
router.use(gmailRouter);

export default router;
