import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    const { idToken } = await request.json();

    if (!idToken) {
        return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    try {
        const adminApp = getAdminApp();
        const auth = adminApp.auth();

        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: expiresIn,
            httpOnly: true,
            secure: true,
        };

        const response = NextResponse.json({ status: 'success' }, { status: 200 });
        response.cookies.set(options);

        return response;

    } catch (error) {
        console.error('Error creating session cookie:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
    }
}
