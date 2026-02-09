'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function addToBuyingList(items: { productId?: string, name: string, barcode?: string, quantity: number, unit: string }[]) {
    console.log('Adding to buying list:', items.length, 'items');

    try {
        for (const item of items) {
            await (prisma as any).needToBuy.create({
                data: {
                    productId: item.productId,
                    name: item.name,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    unit: item.unit,
                    isBought: false
                }
            });
        }

        revalidatePath('/admin');
        revalidatePath('/admin/need-to-buy');
    } catch (error) {
        console.error('Add to buying list error:', error);
        throw error;
    }
}

export async function addManualItemToBuyingList(name: string, quantity: number, unit: string) {
    try {
        await (prisma as any).needToBuy.create({
            data: {
                name,
                quantity,
                unit,
                isBought: false
            }
        });
        revalidatePath('/admin/need-to-buy');
    } catch (error) {
        console.error('Add manual item error:', error);
        throw error;
    }
}

export async function removeFromBuyingList(id: string) {
    await (prisma as any).needToBuy.delete({
        where: { id }
    });
    revalidatePath('/admin');
    revalidatePath('/admin/need-to-buy');
}

export async function markAsBought(id: string) {
    await (prisma as any).needToBuy.update({
        where: { id },
        data: { isBought: true }
    });
    revalidatePath('/admin');
    revalidatePath('/admin/need-to-buy');
}

// RESTORED REPORT ACTIONS
export async function getFinancialSummary(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [sales, wastage] = await Promise.all([
        (prisma as any).sale.findMany({
            where: { createdAt: { gte: startDate } },
            include: { items: true }
        }),
        (prisma as any).stockAdjustment.findMany({
            where: {
                reason: 'WASTAGE',
                createdAt: { gte: startDate }
            },
            include: { batch: true }
        })
    ]);

    let revenue = 0;
    let cost = 0;
    let totalDiscounts = 0;

    sales.forEach((sale: any) => {
        revenue += Number(sale.totalAmount);
        totalDiscounts += Number(sale.discountAmount || 0);
        sale.items.forEach((item: any) => {
            cost += Number(item.purchasePrice) * Number(item.quantity);
        });
    });

    let wastageCost = 0;
    wastage.forEach((adj: any) => {
        const qtyLost = Math.abs(Number(adj.oldQuantity) - Number(adj.newQuantity));
        wastageCost += Number(adj.batch?.purchasePrice || 0) * qtyLost;
    });

    return {
        revenue,
        profit: revenue - cost, // Gross Profit
        wastageCost,
        netProfit: (revenue - cost) - wastageCost,
        totalDiscounts,
        transactions: sales.length,
        avgTicket: sales.length > 0 ? revenue / sales.length : 0
    };
}

export async function getInventoryIntelligence() {
    const products = await prisma.product.findMany();

    let totalStockValue = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach(p => {
        const qty = Number(p.quantity);
        totalStockValue += Number(p.purchasePrice) * qty;
        if (qty <= 0) outOfStock++;
        else if (qty < 5) lowStock++;
    });

    return {
        totalStockValue,
        outOfStock,
        lowStock
    };
}

export async function getProductSalesDetail(startDate: Date) {
    const [items, wastage] = await Promise.all([
        prisma.saleItem.findMany({
            where: { sale: { createdAt: { gte: startDate } } },
            include: { product: true }
        }),
        (prisma as any).stockAdjustment.findMany({
            where: {
                reason: 'WASTAGE',
                createdAt: { gte: startDate }
            },
            include: { batch: true }
        })
    ]);

    const stats: Record<string, any> = {};

    items.forEach(item => {
        const key = item.productId;
        if (!stats[key]) {
            stats[key] = {
                name: item.product.name,
                barcode: item.product.barcode,
                quantity: 0,
                revenue: 0,
                profit: 0,
                discount: 0
            };
        }
        const revenue = Number(item.price) * Number(item.quantity);
        const cost = Number(item.purchasePrice) * Number(item.quantity);
        const discount = (Number((item as any).originalPrice || 0) - Number(item.price)) * Number(item.quantity);

        stats[key].quantity += Number(item.quantity);
        stats[key].revenue += revenue;
        stats[key].profit += (revenue - cost);
        stats[key].discount += Math.max(0, discount);
    });

    // Deduct wastage from product profit
    wastage.forEach((adj: any) => {
        const key = adj.batch?.productId;
        if (key && stats[key]) {
            const qtyLost = Math.abs(Number(adj.oldQuantity) - Number(adj.newQuantity));
            const wastageCost = Number(adj.batch?.purchasePrice || 0) * qtyLost;
            stats[key].profit -= wastageCost;
        }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
}

export async function getDateWiseSales(startDate: Date, endDate: Date) {
    const [sales, wastage] = await Promise.all([
        prisma.sale.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: { items: true }
        }),
        (prisma as any).stockAdjustment.findMany({
            where: {
                reason: 'WASTAGE',
                createdAt: { gte: startDate, lte: endDate }
            },
            include: { batch: true }
        })
    ]);

    const daily: Record<string, any> = {};

    sales.forEach(sale => {
        const dateKey = sale.createdAt.toISOString().split('T')[0];
        if (!daily[dateKey]) {
            daily[dateKey] = { date: dateKey, transactions: 0, revenue: 0, profit: 0, discount: 0 };
        }
        daily[dateKey].transactions++;
        daily[dateKey].revenue += Number(sale.totalAmount);
        daily[dateKey].discount += Number(sale.discountAmount || 0);

        let cost = 0;
        sale.items.forEach(item => {
            cost += Number(item.purchasePrice) * Number(item.quantity);
        });
        daily[dateKey].profit += (Number(sale.totalAmount) - cost);
    });

    // Deduct wastage from daily profit
    wastage.forEach((adj: any) => {
        const dateKey = adj.createdAt.toISOString().split('T')[0];
        if (!daily[dateKey]) {
            daily[dateKey] = { date: dateKey, transactions: 0, revenue: 0, profit: 0, discount: 0 };
        }
        const qtyLost = Math.abs(Number(adj.oldQuantity) - Number(adj.newQuantity));
        const wastageCost = Number(adj.batch?.purchasePrice || 0) * qtyLost;
        daily[dateKey].profit -= wastageCost;
    });

    return Object.values(daily).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getInventorySpending(startDate: Date, endDate: Date) {
    const batches = await (prisma as any).stockBatch.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const dailySpending: Record<string, number> = {};
    let totalSpending = 0;

    batches.forEach((batch: any) => {
        const dateKey = batch.createdAt.toISOString().split('T')[0];
        const cost = Number(batch.initialQuantity) * Number(batch.purchasePrice);

        dailySpending[dateKey] = (dailySpending[dateKey] || 0) + cost;
        totalSpending += cost;
    });

    return {
        dailySpending,
        totalSpending
    };
}

export async function getInventorySpendingDetails(startDate: Date, endDate: Date) {
    const batches = await (prisma as any).stockBatch.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            product: true,
            supplier: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return batches.map((b: any) => ({
        id: b.id,
        date: b.createdAt.toISOString(),
        productName: b.product.name,
        barcode: b.product.barcode,
        quantity: Number(b.initialQuantity),
        unit: b.product.unit || 'pcs',
        purchasePrice: Number(b.purchasePrice),
        cost: Number(b.initialQuantity) * Number(b.purchasePrice),
        supplier: b.supplier ? b.supplier.name : 'Unknown'
    }));
}

export async function getWastageLogs() {
    const logs = await (prisma as any).stockAdjustment.findMany({
        where: { reason: 'WASTAGE' },
        include: {
            batch: {
                include: { product: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return logs.map((l: any) => ({
        id: l.id,
        date: l.createdAt,
        productName: l.batch?.product?.name || 'Deleted Product',
        barcode: l.batch?.product?.barcode || 'N/A',
        quantity: Math.abs(Number(l.oldQuantity)),
        batchId: l.batchId,
        cost: Number(l.batch?.purchasePrice || 0) * Math.abs(Number(l.oldQuantity))
    }));
}
