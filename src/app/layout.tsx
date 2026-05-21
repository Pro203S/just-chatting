import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Just Chatting",
    description: "Just Chatting",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body>
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </body>
        </html>
    );
}
