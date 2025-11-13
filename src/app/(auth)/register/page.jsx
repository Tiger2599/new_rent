"use client"
import { useRouter } from "next/navigation"

export default function register() {
    const router = useRouter();
    const redirect = () => router.push('/login');

    return (
        <>
            <h1>
                Register
            </h1>

            <button
                onClick={redirect}
            >Go to Login</button>
        </>
    )
}
