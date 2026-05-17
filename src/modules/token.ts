import "server-only";

import {
    SignJWT,
    jwtVerify,
    type JWTPayload,
} from "jose";

const accessSecret = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET,
);

const refreshSecret = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET,
);

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
        .setExpirationTime(`${process.env.ACCESS_TOKEN_EXPIRES_IN}s`)
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
        .setExpirationTime(`${process.env.REFRESH_TOKEN_EXPIRES_IN}s`)
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