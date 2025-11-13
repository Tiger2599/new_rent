import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function UserLayout({ children }) {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    return (
        <html lang="en">
            <body>
                <h1>Header</h1>
                {children}
                <h1>Footer</h1>
            </body>
        </html>
    );
}