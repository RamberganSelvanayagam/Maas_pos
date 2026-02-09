'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createBill(formData: FormData) {
    const store = formData.get('store') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dateStr = formData.get('date') as string;
    const notes = formData.get('notes') as string;
    const billImage = formData.get('billImage') as File | null;

    let imagePath = null;

    if (billImage && billImage.size > 0) {
        const fileExt = billImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const arrayBuffer = await billImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Uploading file to Supabase:', filePath);
        const { data, error } = await supabase.storage
            .from('bills')
            .upload(filePath, buffer, {
                contentType: billImage.type,
                upsert: true
            });

        if (error) {
            console.error('Supabase upload error detail:', JSON.stringify(error));
            throw new Error(`Failed to upload image to Supabase: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('bills')
            .getPublicUrl(filePath);

        imagePath = publicUrl;
    }

    const bill = await (prisma as any).bill.create({
        data: {
            store,
            amount,
            date: new Date(dateStr),
            notes,
            imagePath
        }
    });

    revalidatePath('/admin/bills');
    return {
        ...bill,
        amount: Number(bill.amount),
        date: bill.date.toISOString(),
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString()
    };
}

export async function getBills(startDate?: Date, endDate?: Date) {
    const bills = await (prisma as any).bill.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { date: 'desc' }
    });

    return bills.map((b: any) => ({
        ...b,
        amount: Number(b.amount),
        date: b.date.toISOString(),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString()
    }));
}

export async function deleteBill(id: string) {
    await (prisma as any).bill.delete({
        where: { id }
    });
    revalidatePath('/admin/bills');
}
