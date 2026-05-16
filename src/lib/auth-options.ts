import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (user.isBlocked) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.imageUrl,
          role: user.role,
        } as NextAuthUser & { role: UserRole };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AdapterUser & { role?: UserRole };
        token.sub = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const id = token.sub as string;
        const user = await prisma.user.findUnique({
          where: { id },
          select: { id: true, email: true, name: true, imageUrl: true, role: true, isBlocked: true },
        });

        if (user) {
          session.user.id = user.id;
          session.user.email = user.email;
          session.user.name = user.name;
          session.user.image = user.imageUrl;
          session.user.role = user.role;
          session.user.isBlocked = user.isBlocked;
        } else {
          session.user.id = id;
          session.user.role = token.role as UserRole;
          session.user.isBlocked = true;
        }
      }
      return session;
    },
  },
};
