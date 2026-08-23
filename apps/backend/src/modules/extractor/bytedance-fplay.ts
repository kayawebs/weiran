import { createDecipheriv, createHash } from "node:crypto";

const FPLAY_KDF_SALT = Buffer.from(
  "TdTC5rgxYgkOUrPHpnM7pByyRiuCmrWKGWs521cXdST0m69/COjWjSanLjfBqVovHwWlGJKu8pSXMrYqOKrdWA==",
  "base64"
);

function base64Bytes(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

/** Decrypts the signed media URL envelope returned by ByteDance fplay APIs. */
export function decryptByteDanceFplayUrl(encryptedValue: string, keySeed: string): string {
  const encrypted = base64Bytes(encryptedValue);
  if (encrypted.length <= 20 || !encrypted.subarray(0, 4).equals(Buffer.from([0xa8, 0x00, 0x01, 0x00]))) {
    throw new Error("Unsupported encrypted media URL");
  }
  const seed = base64Bytes(keySeed);
  const firstHash = createHash("sha512").update(seed).digest();
  const derived = createHash("sha512").update(Buffer.concat([firstHash, FPLAY_KDF_SALT])).digest();
  const decipher = createDecipheriv("aes-128-cbc", derived.subarray(0, 16), derived.subarray(16, 32));
  const decrypted = Buffer.concat([decipher.update(encrypted.subarray(4)), decipher.final()]).toString("utf8");
  if (!/^https?:\/\//i.test(decrypted)) throw new Error("Invalid decrypted media URL");
  return decrypted;
}
