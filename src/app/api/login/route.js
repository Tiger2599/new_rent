import { NextResponse } from "next/server";

export async function POST(req,res ){
    try {
        const { email, password } = await req.json();

        let res = NextResponse.json(
            { message: "Response Get" },
            { status: 200 }
        )

        // res.cookies.set("token", "fake-jwt-token", {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     path: "/",
        //     maxAge: 60 * 60 * 24,
        // });

        return res;
    } catch (error) {
        return NextResponse.json(
            { message: "Login faild", error: error.message },
            { status: 500 }
        )
    }
}