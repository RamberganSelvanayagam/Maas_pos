'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function processSale(cart: any[], paymentMethod: string) {
    const totalAmount = cart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
    console.log('Processing sale for cart:', cart.length, 'items', 'Total:', totalAmount);

    try {
        const itemIds = cart.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: itemIds } }
        });

        // Calculate total discount from ALL items (cart items should have price and originalPrice)
        let totalDiscountAmount = 0;
        cart.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const regularPrice = Number(product.sellingPrice);
                const actualPrice = Number(item.price);
                if (actualPrice < regularPrice) {
                    totalDiscountAmount += (regularPrice - actualPrice) * Number(item.quantity);
                }
            }
        });

        // 1. Create the sale record
        const saleRecord = await (prisma as any).sale.create({
            data: {
                totalAmount,
                paymentMethod,
                vatAmount: totalAmount * 0.15,
                discountAmount: totalDiscountAmount,
                items: {
                    create: cart.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return {
                            productId: item.productId,
                            batchId: item.batchId || null,
                            quantity: item.quantity,
                            price: item.price,
                            purchasePrice: item.purchasePrice || 0,
                            originalPrice: product ? Number(product.sellingPrice) : item.price
                        };
                    })
                }
            }
        });

        // 2. Stock Deduction Logic
        for (const item of cart) {
            if (item.batchId) {
                const batch = await (prisma as any).stockBatch.findUnique({ where: { id: item.batchId } });
                if (batch) {
                    const newQty = Number(batch.remainingQuantity) - Number(item.quantity);
                    await (prisma as any).stockBatch.update({
                        where: { id: item.batchId },
                        data: { remainingQuantity: Math.max(0, newQty) }
                    });
                }
            }

            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    quantity: { decrement: item.quantity }
                }
            });
        }

        revalidatePath('/');
        revalidatePath('/inventory');
        revalidatePath('/pos');
        revalidatePath('/admin');
        for (const id of itemIds) {
            revalidatePath(`/admin/product/${id}`);
        }

        return {
            id: saleRecord.id,
            totalAmount: Number(saleRecord.totalAmount),
            createdAt: saleRecord.createdAt
        };
    } catch (error) {
        console.error('Checkout error:', error);
        throw error;
    }
}
