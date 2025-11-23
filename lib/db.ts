import { PrismaClient as PrismaClientNode } from "@prisma/client";
import { PrismaClient as PrismaClientEdge } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientInstance | undefined;
};

const isEdgeRuntime = typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime !== "undefined";

function createPrismaClient() {
    const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
    const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;
    const databaseUrl = process.env.DATABASE_URL;

    // Check if we're in a build context (Vercel sets VERCEL=1 during builds)
    const isBuildContext = process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'production';
    const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';

    // During build, if no database URL is provided, use a placeholder
    // This allows the build to complete, but the app will need env vars at runtime
    if ((isBuildContext || isNextBuild) && !databaseUrl && !directDatabaseUrl && !accelerateUrl) {
        // Use a dummy connection string that Prisma will accept but won't actually connect
        // This is only for build-time - runtime will require real env vars
        return new PrismaClientNode({
            datasources: {
                db: { url: "postgresql://user:password@localhost:5432/db?schema=public" },
            },
            log: [],
        }) as any;
    }

    if (accelerateUrl) {
        return new PrismaClientEdge({
            datasourceUrl: accelerateUrl,
        }).$extends(withAccelerate());
    }

    if (isEdgeRuntime) {
        throw new Error("PRISMA_ACCELERATE_URL must be set in Edge runtimes.");
    }

    const datasourceUrl = directDatabaseUrl ?? databaseUrl;

    if (!datasourceUrl) {
        throw new Error("Missing DATABASE_URL or DIRECT_DATABASE_URL environment variable.");
    }

    return new PrismaClientNode({
        datasources: {
            db: { url: datasourceUrl },
        },
    });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (!isEdgeRuntime && process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}