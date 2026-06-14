import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Email ou senha incorretos');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Email ou senha incorretos');
        }

        // Generate a JWT token using the backend's secret
        const token = jwt.sign(
          { userId: user.id, role: user.role, squadId: user.squadId },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          squadId: user.squadId,
          token, // Include the JWT token
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name || '';
        token.email = user.email || '';
        token.role = (user as { role: 'GAME_MASTER' | 'PLAYER' | 'OBSERVER' }).role;
        token.squadId = (user as { squadId: string | null }).squadId;
        token.token = (user as { token: string }).token; // Store the JWT string in the JWT
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        role: token.role as 'GAME_MASTER' | 'PLAYER' | 'OBSERVER',
        squadId: token.squadId as string | null,
        token: (token as { token?: string }).token ?? '',
      };
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };