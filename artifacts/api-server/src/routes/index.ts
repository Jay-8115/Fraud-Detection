import { Router } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import filesRouter from "./files";
import analysisRouter from "./analysis";
import chatRouter from "./chat";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router = Router();

router.use("/", healthRouter);
router.use("/users", usersRouter);
router.use("/files", filesRouter);
router.use("/analysis", analysisRouter);
router.use("/chat", chatRouter);
router.use("/reports", reportsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/admin", adminRouter);

export default router;
