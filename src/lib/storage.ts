import os from "os";
import path from "path";
import fs from "fs";

export function getUploadDir(): string {
  // Use os.tmpdir() to ensure compatibility with serverless environments (Vercel / Lambda) where process.cwd() is read-only
  const dir = path.join(os.tmpdir(), "uploads");
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create upload directory in os.tmpdir():", err);
  }
  return dir;
}

export function safeWriteFile(filePath: string, buffer: Buffer): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (err) {
    console.warn(`safeWriteFile failed for ${filePath}:`, err);
    return false;
  }
}

export function safeUnlinkFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.warn(`safeUnlinkFile failed for ${filePath}:`, err);
  }
  return false;
}

export function safeReadFile(filePath: string): Buffer | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  } catch (err) {
    console.warn(`safeReadFile failed for ${filePath}:`, err);
  }
  return null;
}
