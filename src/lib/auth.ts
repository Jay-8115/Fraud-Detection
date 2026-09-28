import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { encrypt, decrypt, hashForLookup } from "@/lib/crypto";

export interface AuthenticatedUser {
  id: number;
  clerkId: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      console.log(`[AUTH-SYNC] No clerkId found in auth() context.`);
      return null;
    }
    console.log(`[AUTH-SYNC] clerkId present in auth() context.`);

    // Fast path: Find user by clerkId or clerkIdHmac
    const hmacClerkId = hashForLookup(clerkId);
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkIdHmac, hmacClerkId || ""),
    });

    // Synchronization path: User doesn't exist, link by email or create new
    if (!user) {
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return null;
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email.split("@")[0] || "Unknown User";

      const emailHmac = hashForLookup(email);

      const existingEmailUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.emailHmac, emailHmac || ""),
      });

      if (existingEmailUser) {
        // Link existing legacy account to new Clerk identity
        const updated = await db.update(usersTable)
          .set({ 
            clerkIdEncrypted: encrypt(clerkId),
            clerkIdHmac: hashForLookup(clerkId),
            name: name,
            updatedAt: new Date() 
          })
          .where(eq(usersTable.id, existingEmailUser.id))
          .returning();
        
        user = updated[0];
      } else {
        // Create new user (idempotent upsert safely handles race conditions)
        const inserted = await db.insert(usersTable).values({
          clerkIdEncrypted: encrypt(clerkId),
          clerkIdHmac: hashForLookup(clerkId),
          emailEncrypted: encrypt(email),
          emailHmac: hashForLookup(email),
          name: name,
          role: "user",
          password: "", // Clerk handles passwords, do not store secrets
        }).onConflictDoUpdate({
          target: usersTable.clerkIdHmac,
          set: { 
            emailEncrypted: encrypt(email),
            emailHmac: hashForLookup(email),
            name: name,
            updatedAt: new Date() 
          }
        }).returning();
        
        user = inserted[0];
      }
    }

    if (!user || user.isBlocked) {
      return null;
    }

    // Fire-and-forget last login update (non-blocking)
    db.update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .execute()
      .catch(err => {
        // Log safe message without exposing user secrets
        console.error("Failed to update user login timestamp"); 
      });

    // Sync role to Clerk if missing
    if (user.role === "admin") {
      try {
        const clerkClient = await import("@clerk/nextjs/server").then(m => m.clerkClient());
        const clerkUserObj = await clerkClient.users.getUser(clerkId);
        if (clerkUserObj.publicMetadata.role !== "admin") {
          await clerkClient.users.updateUserMetadata(clerkId, {
            publicMetadata: { role: "admin" }
          });
          console.log(`Synced admin role to Clerk metadata for user ${clerkId}`);
        }
      } catch (metaErr) {
        console.error("Failed to sync role to Clerk metadata", metaErr);
      }
    }

    return {
      id: user.id,
      clerkId: decrypt(user.clerkIdEncrypted) || "Unknown",
      email: decrypt(user.emailEncrypted) || "Unknown",
      name: user.name || "Unknown",
      role: user.role as "user" | "admin",
    };
  } catch (err: any) {
    if (err && err.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err; // Let Next.js handle dynamic rendering
    }
    console.error("Authentication synchronization error:", err);
    return null;
  }
}
