import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type AuthRequest = Request & {
  userId?: number;
  clerkId?: string;
  userEmail?: string;
  userRole?: string;
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
    if (!user) {
      const email = (auth as any)?.sessionClaims?.email ?? "";
      const name = (auth as any)?.sessionClaims?.name ?? email.split("@")[0] ?? "User";
      const [newUser] = await db
        .insert(usersTable)
        .values({ clerkId, email, name, role: "user", isBlocked: false })
        .returning();
      user = newUser;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }

    req.userId = user.id;
    req.clerkId = clerkId;
    req.userEmail = user.email;
    req.userRole = user.role;
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAuth error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, () => {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
};
