import { signIn } from "@/auth";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            return NextResponse.json({
                message: 'Login successful',
                // Note: Auth.js handles the user object in the session.
                // Redirecting to home or refreshing will show the user state.
            });
        } catch (error) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
