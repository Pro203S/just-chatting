if (typeof window !== "undefined") {
    throw new Error("server-only module");
}

import {
    SignJWT,
    jwtVerify,
    type JWTPayload,
} from "jose";

function getRequiredEnv(name: keyof NodeJS.ProcessEnv): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} env is required.`);
    }

    return value;
}

function getEnvSeconds(name: keyof NodeJS.ProcessEnv): number {
    const value = getRequiredEnv(name).replace(/;$/, "");
    const seconds = Number(value);

    if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error(`${name} env must be a positive number of seconds.`);
    }

    return seconds;
}

const accessSecret = new TextEncoder().encode(
    getRequiredEnv("JWT_ACCESS_SECRET"),
);

const refreshSecret = new TextEncoder().encode(
    getRequiredEnv("JWT_REFRESH_SECRET"),
);

export const ACCESS_TOKEN_EXPIRES_IN = getEnvSeconds("ACCESS_TOKEN_EXPIRES_IN");
export const REFRESH_TOKEN_EXPIRES_IN = getEnvSeconds("REFRESH_TOKEN_EXPIRES_IN");

export interface AccessTokenPayload extends JWTPayload {
    userId: IdTypes;
}

export interface RefreshTokenPayload extends JWTPayload {
    userId: IdTypes;
}

export async function createAccessToken(
    userId: IdTypes,
): Promise<string> {
    return await new SignJWT({
        userId,
    })
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TOKEN_EXPIRES_IN}s`)
        .sign(accessSecret);
}

export async function createRefreshToken(
    userId: IdTypes,
): Promise<string> {
    return await new SignJWT({
        userId,
    })
        .setProtectedHeader({
            alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(`${REFRESH_TOKEN_EXPIRES_IN}s`)
        .sign(refreshSecret);
}

export async function verifyAccessToken(
    token: string,
): Promise<AccessTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(
            token,
            accessSecret,
        );

        return payload as AccessTokenPayload;
    } catch {
        return null;
    }
}

export async function verifyRefreshToken(
    token: string,
): Promise<RefreshTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(
            token,
            refreshSecret,
        );

        return payload as RefreshTokenPayload;
    } catch {
        return null;
    }
}
