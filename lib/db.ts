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

    // Use Prisma Accelerate if available
    if (accelerateUrl) {
        // Prisma Accelerate works with PrismaClientEdge for both Edge and Node runtimes
        return new PrismaClientEdge({
            datasourceUrl: accelerateUrl,
        }).$extends(withAccelerate());
    }

    // Fallback to direct database connection if Accelerate is not available
    if (isEdgeRuntime) {
        throw new Error("PRISMA_ACCELERATE_URL must be set in Edge runtimes.");
    }

    const datasourceUrl = directDatabaseUrl ?? databaseUrl;

    if (!datasourceUrl) {
        throw new Error("Missing DATABASE_URL or DIRECT_DATABASE_URL environment variable.");
    }

    // Add connection pooling parameters to prevent "too many connections" error
    // For serverless (Vercel), use connection_limit=1 per function
    // This ensures each serverless function only uses 1 connection
    let connectionUrl = datasourceUrl;
    
    // Build query parameters
    const urlParams = new URLSearchParams();
    if (connectionUrl.includes('?')) {
        const [baseUrl, existingParams] = connectionUrl.split('?');
        const existing = new URLSearchParams(existingParams);
        existing.forEach((value, key) => urlParams.set(key, value));
        connectionUrl = baseUrl;
    }
    
    // Add/update connection parameters
    if (!urlParams.has('connection_limit')) {
        urlParams.set('connection_limit', '1');
    }
    if (!urlParams.has('pool_timeout')) {
        urlParams.set('pool_timeout', '20');
    }
    if (!urlParams.has('connect_timeout')) {
        urlParams.set('connect_timeout', '10');
    }
    // Add keepalive to prevent connection resets
    if (!urlParams.has('keepalive')) {
        urlParams.set('keepalive', 'true');
    }
    if (!urlParams.has('keepalive_idle')) {
        urlParams.set('keepalive_idle', '600');
    }
    
    connectionUrl = `${connectionUrl}?${urlParams.toString()}`;

    return new PrismaClientNode({
        datasources: {
            db: { url: connectionUrl },
        },
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
}

export const db = createPrismaClient();

// Always use singleton pattern to prevent multiple Prisma instances
// This is critical for serverless environments like Vercel
if (!isEdgeRuntime) {
    globalForPrisma.prisma = db;
}