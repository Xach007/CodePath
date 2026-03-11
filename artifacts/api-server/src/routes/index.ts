import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import progressRouter from "./progress";
import gamificationRouter from "./gamification";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(coursesRouter);
router.use(lessonsRouter);
router.use(progressRouter);
router.use(gamificationRouter);
router.use(adminRouter);

export default router;
