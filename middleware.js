import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("token")?.value;

    if (!token && req.nextUrl.pathname.startsWith("/user")) {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/user/:path*"],
};