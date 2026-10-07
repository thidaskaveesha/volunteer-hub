import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

function getPepper() {
  const pepper = process.env.AUTH_PASSWORD_PEPPER;
  if (!pepper) {
    throw new Error("Missing AUTH_PASSWORD_PEPPER. Configure it before using password authentication.");
  }
  return pepper;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(`${password}${getPepper()}`, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex || !/^[0-9a-f]+$/i.test(expectedHex)) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(`${password}${getPepper()}`, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
