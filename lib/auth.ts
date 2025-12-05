import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const auth = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  return {
    userId: session.user.id,
    user: session.user,
  };
};

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        let user;
        try {
          user = await db.user.findUnique({
          where: {
            phoneNumber: credentials.phoneNumber,
          },
        });
        } catch (error: any) {
          // Handle connection errors gracefully
          if (error?.message?.includes("Can't reach database") || 
              error?.code === "P1001" || 
              error?.code === "P1017") {
            console.error("[AUTH] Database connection error:", error.message);
            throw new Error("Database connection failed. Please try again.");
          }
          throw error;
        }

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Remove maxAge to make sessions persist indefinitely
    updateAge: 0, // Disable session updates
  },
  jwt: {
    // Remove maxAge to make JWT tokens persist indefinitely
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.phoneNumber = token.phoneNumber;
        session.user.image = token.picture ?? undefined;
        session.user.role = token.role;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // When user first signs in, set the token with user data
        return {
          ...token,
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          picture: (user as any).picture,
          role: user.role?.toUpperCase() || "USER", // Ensure role is uppercase
        };
      }

      // On subsequent requests, refresh role from database to ensure it's up to date
      // Only refresh if role is not already in token to reduce database calls
      // Add timeout to prevent blocking if database is slow
      if (token?.id && !token.role) {
        try {
          // Add timeout to prevent slow database from blocking auth
          const rolePromise = db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Role fetch timeout')), 2000)
          );
          
          const dbUser = await Promise.race([rolePromise, timeoutPromise]) as any;
          if (dbUser?.role) {
            token.role = dbUser.role.toUpperCase() || "USER";
          } else {
            token.role = "USER"; // Default if not found
          }
        } catch (error) {
          // Silently fail - use existing role or default to USER
          // Don't log timeout errors to reduce noise
          if (!(error as Error)?.message?.includes('timeout')) {
            console.error("Error refreshing user role:", error);
          }
          token.role = token.role || "USER";
        }
      }

      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
}; 