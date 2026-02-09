import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prisma_v2: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma_v2 ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma_v2 = prisma
}

/**
 * Note: If you add new models to the schema, you might need to restart 
 * the dev server as globalThis.prisma survives hot reloads.
 */
