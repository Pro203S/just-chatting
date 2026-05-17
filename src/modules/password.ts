import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string) {
    const salt = randomBytes(SALT_LENGTH).toString("hex");
    const hash = await scrypt(password, salt, KEY_LENGTH) as Buffer;

    return `${HASH_PREFIX}:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
    hashedPassword: string,
    password: string,
): Promise<boolean> {
    if (hashedPassword.startsWith("$argon2")) {
        try {
            const argon2 = await import("argon2");
            return await argon2.default.verify(hashedPassword, password);
        } catch {
            return false;
        }
    }

    const [prefix, salt, storedHash] = hashedPassword.split(":");
    if (prefix !== HASH_PREFIX || !salt || !storedHash) {
        return false;
    }

    const actualHash = await scrypt(password, salt, KEY_LENGTH) as Buffer;
    const expectedHash = Buffer.from(storedHash, "hex");

    if (expectedHash.length !== actualHash.length) {
        return false;
    }

    return timingSafeEqual(expectedHash, actualHash);
}
