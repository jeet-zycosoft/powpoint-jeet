// app/api/auth/[...nextauth]/route.js (App Router example)
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    // Add other configurations like callbacks, pages, etc. as needed
});

export { handler as GET, handler as POST };
