// ============================================================
//  server/src/config/database.js
//  Prisma client singleton — safe for serverless + long-running servers
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;


// ============================================================
//  server/src/utils/crypto.js
//  AES-256-GCM field-level encryption for PII (email, phone)
// ============================================================

import crypto from "crypto";

const ALGO      = "aes-256-gcm";
const KEY       = Buffer.from(process.env.ENCRYPTION_KEY, "hex"); // 32-byte hex key
const IV_LENGTH = 12;  // GCM standard

/**
 * Encrypt a plaintext string. Returns "iv:authTag:ciphertext" (all hex).
 * Returns null if input is null/undefined.
 */
export function encrypt(text) {
  if (text == null) return null;
  const iv     = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc    = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/**
 * Decrypt a string produced by encrypt(). Returns null on failure.
 */
export function decrypt(blob) {
  if (!blob) return null;
  try {
    const [ivHex, tagHex, dataHex] = blob.split(":");
    const decipher = crypto.createDecipheriv(
      ALGO,
      KEY,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}


// ============================================================
//  server/src/utils/tenantGuard.js
//  Helpers that ensure every Prisma query is scoped to company_id
// ============================================================

/**
 * Builds the standard tenant where-clause.
 * Merge this into every Prisma findMany / findFirst / update / delete.
 *
 * Usage:
 *   const contacts = await prisma.contact.findMany({
 *     where: { ...tenantWhere(req.company_id), deletedAt: null },
 *   });
 */
export function tenantWhere(companyId) {
  if (!companyId) throw new Error("company_id is required for all queries");
  return { companyId };
}

/**
 * Assert a fetched record belongs to the requesting tenant.
 * Throws 403 if there's a mismatch (prevents IDOR attacks).
 */
export function assertTenant(record, companyId) {
  if (!record || record.companyId !== companyId) {
    const err = new Error("Forbidden — tenant mismatch");
    err.status = 403;
    throw err;
  }
}