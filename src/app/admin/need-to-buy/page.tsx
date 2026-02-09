import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { removeFromBuyingList, markAsBought, addManualItemToBuyingList } from '../actions';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function NeedToBuyPage() {
    const rawItems = await (prisma as any).needToBuy?.findMany({
        orderBy: { createdAt: 'desc' },
        include: { product: true }
    }) || [];

    // Serialize Decimals for plain object passing
    const items = rawItems.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity)
    }));

    const pendingItems = items.filter((i: any) => !i.isBought);
    const completedItems = items.filter((i: any) => i.isBought);

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Inventory
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Need to Buy List</h1>
                    <Link href="/inventory" className="btn btn-primary">Add New Product</Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add Item Manually</h3>
                <form action={async (formData) => {
                    'use server';
                    const name = formData.get('name') as string;
                    const quantity = parseFloat(formData.get('quantity') as string) || 1;
                    const unit = formData.get('unit') as string;
                    await addManualItemToBuyingList(name, quantity, unit);
                }} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input type="text" name="name" placeholder="Item Name (e.g. Sugar)" required style={{ flex: 2, padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--background)' }} />
                    <input type="number" name="quantity" placeholder="Qty" step="1" min="0" required style={{ flex: 0.5, padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--background)' }} />
                    <select name="unit" style={{ flex: 0.5, padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--background)' }}>
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="box">box</option>
                        <option value="liter">liter</option>
                        <option value="ml">ml</option>
                    </select>
                    <button type="submit" className="btn btn-primary">Add to List</button>
                </form>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
                <section>
                    <h3 style={{ marginBottom: '1rem' }}>Pending Replenishment</h3>
                    {pendingItems.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Your buying list is empty.
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                                        <th style={{ padding: '1rem' }}>Item</th>
                                        <th style={{ padding: '1rem' }}>Quantity</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingItems.map((item: any) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.barcode || 'Manual Entry'}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="badge">{Number(item.quantity).toString()} {item.unit}</span>
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <form action={async () => {
                                                    'use server';
                                                    await markAsBought(item.id);
                                                }}>
                                                    <button type="submit" className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Mark Bought</button>
                                                </form>
                                                <form action={async () => {
                                                    'use server';
                                                    await removeFromBuyingList(item.id);
                                                }}>
                                                    <button type="submit" className="btn btn-error" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {completedItems.length > 0 && (
                    <section>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Recently Bought</h3>
                        <div className="card" style={{ padding: 0, opacity: 0.7 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <tbody>
                                    {completedItems.map((item: any) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', textDecoration: 'line-through' }}>
                                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="badge">{Number(item.quantity).toString()} {item.unit}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <form action={async () => {
                                                    'use server';
                                                    await removeFromBuyingList(item.id);
                                                }}>
                                                    <button type="submit" className="btn btn-error" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Clear</button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
