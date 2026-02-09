'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function searchProducts(query: string) {
    if (!query || query.length < 2) return [];

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { barcode: { contains: query } }
            ]
        },
        include: { category: true, supplier: true },
        take: 10
    });

    return products.map(p => ({
        ...p,
        purchasePrice: Number(p.purchasePrice),
        sellingPrice: Number(p.sellingPrice),
        taxRate: Number(p.taxRate),
        quantity: Number(p.quantity)
    }));
}

export async function getProductByBarcode(barcode: string) {
    const product = await prisma.product.findUnique({
        where: { barcode },
        include: {
            category: true,
            supplier: true,
            batches: {
                where: { remainingQuantity: { gt: 0 } },
                orderBy: { expiryDate: 'asc' }
            }
        }
    });

    if (!product) return null;

    return {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        purchasePrice: Number(product.purchasePrice),
        sellingPrice: Number(product.sellingPrice),
        taxRate: Number(product.taxRate),
        quantity: Number(product.quantity),
        unit: (product as any).unit || 'pcs',
        expiryDate: product.expiryDate?.toISOString() || null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        category: product.category ? { id: product.category.id, name: product.category.name } : null,
        supplier: product.supplier ? { id: product.supplier.id, name: product.supplier.name } : null,
        batches: product.batches.map((b: any) => ({
            id: b.id,
            productId: b.productId,
            supplierId: b.supplierId,
            initialQuantity: Number(b.initialQuantity),
            remainingQuantity: Number(b.remainingQuantity),
            purchasePrice: Number(b.purchasePrice),
            expiryDate: b.expiryDate?.toISOString() || null,
            createdAt: b.createdAt.toISOString()
        }))
    };
}

export async function getProductById(id: string, includeAllBatches = false) {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            supplier: true,
            batches: {
                where: includeAllBatches ? {} : { remainingQuantity: { gt: 0 } },
                include: { supplier: true },
                orderBy: { expiryDate: 'asc' }
            }
        }
    });

    if (!product) return null;

    return {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        purchasePrice: Number(product.purchasePrice),
        sellingPrice: Number(product.sellingPrice),
        taxRate: Number(product.taxRate),
        quantity: Number(product.quantity),
        unit: (product as any).unit || 'pcs',
        expiryDate: product.expiryDate?.toISOString() || null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        category: product.category ? { id: product.category.id, name: product.category.name } : null,
        supplier: product.supplier ? { id: product.supplier.id, name: product.supplier.name } : null,
        batches: product.batches.map((b: any) => ({
            id: b.id,
            productId: b.productId,
            supplierId: b.supplierId,
            initialQuantity: Number(b.initialQuantity),
            remainingQuantity: Number(b.remainingQuantity),
            purchasePrice: Number(b.purchasePrice),
            expiryDate: b.expiryDate?.toISOString() || null,
            createdAt: b.createdAt.toISOString(),
            supplier: b.supplier ? { id: b.supplier.id, name: b.supplier.name } : null
        }))
    };
}

export async function upsertProduct(formData: FormData) {
    const barcode = formData.get('barcode') as string;
    const name = formData.get('name') as string;
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string);
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const quantity = parseFloat(formData.get('quantity') as string);
    const unit = (formData.get('unit') as string) || 'pcs';
    const supplierName = formData.get('supplier') as string;
    const categoryName = formData.get('category') as string;
    const expiryDateStr = formData.get('expiryDate') as string;
    const noExpiry = formData.get('noExpiry') === 'on';
    const expiryDate = noExpiry ? null : (expiryDateStr ? new Date(expiryDateStr) : null);

    // Handle supplier and category (simple creation if not exists)
    let supplierId = null;
    if (supplierName) {
        const s = await prisma.supplier.upsert({
            where: { name: supplierName },
            update: {},
            create: { name: supplierName }
        });
        supplierId = s.id;
    }

    let categoryId = null;
    if (categoryName) {
        const c = await prisma.category.upsert({
            where: { name: categoryName },
            update: {},
            create: { name: categoryName }
        });
        categoryId = c.id;
    }

    const product = await (prisma as any).product.upsert({
        where: { barcode },
        update: {
            name,
            purchasePrice,
            sellingPrice,
            quantity: { increment: quantity },
            unit,
            supplierId,
            categoryId,
            expiryDate
        },
        create: {
            barcode,
            name,
            purchasePrice,
            sellingPrice,
            quantity,
            unit,
            supplierId,
            categoryId,
            expiryDate
        }
    });

    // Create a new StockBatch record for this intake
    // Using remainingQuantity for real-time tracking
    await (prisma as any).stockBatch.create({
        data: {
            productId: product.id,
            supplierId,
            initialQuantity: quantity,
            remainingQuantity: quantity,
            purchasePrice,
            expiryDate
        }
    });

    revalidatePath('/inventory');
    revalidatePath('/');
}

export async function adjustBatchStock(batchId: string, newQuantity: number, reason: string) {
    const batch = await (prisma as any).stockBatch.findUnique({
        where: { id: batchId },
        include: { product: true }
    });

    if (!batch) throw new Error('Batch not found');

    const oldQuantity = Number(batch.remainingQuantity);
    const difference = newQuantity - oldQuantity;

    await prisma.$transaction(async (tx) => {
        // 1. Update the batch (never delete to preserve history)
        await (tx as any).stockBatch.update({
            where: { id: batchId },
            data: { remainingQuantity: newQuantity }
        });

        // 2. Create adjustment log
        await (tx as any).stockAdjustment.create({
            data: {
                batchId,
                oldQuantity,
                newQuantity,
                reason
            }
        });

        // 3. Update the master product count (SKIP for audits as per user request)
        if (reason !== 'Inventory Audit') {
            await tx.product.update({
                where: { id: batch.productId },
                data: { quantity: { increment: difference } }
            });
        }
    });

    revalidatePath('/admin');
    revalidatePath(`/admin/product/${batch.productId}`);
}

export async function divideProduct(sourceBatchId: string, targetBarcode: string, quantityToMove: number, targetName: string, targetSellingPrice: number) {
    const sourceBatch = await (prisma as any).stockBatch.findUnique({
        where: { id: sourceBatchId },
        include: { product: true }
    });

    if (!sourceBatch) throw new Error('Source batch not found');
    if (sourceBatch.remainingQuantity < quantityToMove) throw new Error('Insufficient quantity in source batch');

    await prisma.$transaction(async (tx) => {
        // 1. Deduct from source
        await (tx as any).stockBatch.update({
            where: { id: sourceBatchId },
            data: { remainingQuantity: { decrement: quantityToMove } }
        });

        await tx.product.update({
            where: { id: sourceBatch.productId },
            data: { quantity: { decrement: quantityToMove } }
        });

        // 2. Identify or create target product
        let targetProduct = await tx.product.findUnique({ where: { barcode: targetBarcode } });

        if (!targetProduct) {
            targetProduct = await (tx as any).product.create({
                data: {
                    barcode: targetBarcode,
                    name: targetName,
                    sellingPrice: targetSellingPrice,
                    purchasePrice: sourceBatch.purchasePrice, // Inherit cost
                    quantity: 0,
                    unit: 'pcs', // Retail is usually pcs
                    categoryId: sourceBatch.product.categoryId,
                    supplierId: sourceBatch.supplierId
                }
            });
        }

        // 3. Add to target via new batch
        if (targetProduct) {
            await tx.product.update({
                where: { id: (targetProduct as any).id },
                data: { quantity: { increment: quantityToMove } }
            });

            await (tx as any).stockBatch.create({
                data: {
                    productId: (targetProduct as any).id,
                    initialQuantity: quantityToMove,
                    remainingQuantity: quantityToMove,
                    purchasePrice: sourceBatch.purchasePrice,
                    expiryDate: sourceBatch.expiryDate
                }
            });
        }

        // Log the adjustment for source
        await (tx as any).stockAdjustment.create({
            data: {
                batchId: sourceBatchId,
                oldQuantity: sourceBatch.remainingQuantity,
                newQuantity: Number(sourceBatch.remainingQuantity) - quantityToMove,
                reason: `Divided into ${targetBarcode}`
            }
        });
    });

    revalidatePath('/inventory');
    revalidatePath('/admin');
    revalidatePath(`/admin/product/${sourceBatch.productId}`);
}

export async function markBatchAsWastage(batchId: string) {
    const batch = await (prisma as any).stockBatch.findUnique({
        where: { id: batchId },
        include: { product: true }
    });

    if (!batch) throw new Error('Batch not found');

    const quantityToWastage = Number(batch.remainingQuantity);

    await prisma.$transaction(async (tx) => {
        // 1. Create adjustment log with "WASTAGE" reason
        await (tx as any).stockAdjustment.create({
            data: {
                batchId: batch.id,
                oldQuantity: quantityToWastage,
                newQuantity: 0,
                reason: 'WASTAGE'
            }
        });

        // 2. Decrement master product stock
        await tx.product.update({
            where: { id: batch.productId },
            data: { quantity: { decrement: quantityToWastage } }
        });

        // 3. Zero out the batch remainingQuantity (do not delete for reporting)
        await (tx as any).stockBatch.update({
            where: { id: batchId },
            data: { remainingQuantity: 0 }
        });
    });

    revalidatePath('/admin');
    revalidatePath(`/admin/product/${batch.productId}`);
    return { success: true };
}
