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

        let user;
        try {
          user = await prisma.user.findUnique({ where: { email } });
        } catch (err) {
          console.error("[auth] database error during login:", err);
          throw new Error("Falha ao conectar ao banco de dados. Verifique a DATABASE_URL.");
        }

        if (!user) return null;
        if (user.isBlocked) {
          throw new Error("Usuário bloqueado. Contate a gestão.");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.imageUrl,
          role: user.role,
          isBlocked: user.isBlocked,
        } as NextAuthUser & { role: UserRole; isBlocked: boolean };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AdapterUser & { role?: UserRole; isBlocked?: boolean };
        token.sub = u.id;
        token.role = u.role;
        token.isBlocked = u.isBlocked;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
        session.user.isBlocked = Boolean(token.isBlocked);
      }
      return session;
    },
  },
};
