"use client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import log from "@/healper/log";

export default function login (){
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const redirect = () => router.push('/register');
    const onLogin = async(e) => {
        e.preventDefault();

        const response = await axios.post('/api/login',form);
        console.log(response);
        router.push("user/dashboard");
    }

    // useEffect(() => {
    //     log("Login Page Loaded");
    // },[form])

    return(
        <>
            <h1>Login</h1>
            
            <form onSubmit={onLogin}>
                <input 
                    type="text" 
                    placeholder="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email:e.target.value})}/>

                <input 
                    type="password" 
                    placeholder="password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password:e.target.value})}/>

                <button
                    type="submit">
                    Submit</button>
            </form>

            <button
                onClick={redirect}
            >Go to Register</button>
        </>
    )
}
