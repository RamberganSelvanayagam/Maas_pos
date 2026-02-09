import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getProductById } from '@/app/inventory/actions';
import BatchManagementTable from './BatchManagementTable';
import DivideBulkButton from './DivideBulkButton';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Use the standardized server action to get serialized product
    const product: any = await getProductById(id, true);

    if (!product) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Product not found</h2>
                <Link href="/admin" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Inventory</Link>
            </div>
        );
    }

    // Fetch sale items separately or include them if needed
    const saleItemsRaw = await prisma.saleItem.findMany({
        where: { productId: id },
        include: { sale: true },
        orderBy: { sale: { createdAt: 'desc' } },
        take: 20
    });

    const serializedSaleItems = saleItemsRaw.map((s: any) => ({
        id: s.id,
        price: Number(s.price),
        originalPrice: Number(s.originalPrice),
        quantity: Number(s.quantity),
        sale: {
            id: s.sale.id,
            createdAt: s.sale.createdAt.toISOString()
        }
    }));

    const serializedProduct = {
        ...product,
        saleItems: serializedSaleItems
    };

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Inventory List
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <div>
                        <h1>{product.name} Stock Management</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{product.barcode} | {product.category?.name || 'Uncategorized'}</p>
                    </div>
                    <DivideBulkButton product={serializedProduct} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Final Stock (On Hand)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Number(product.quantity).toString()} {(product as any).unit}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Initial Stock (Bought)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {product.batches.reduce((acc: number, b: any) => acc + Number(b.initialQuantity), 0)} {(product as any).unit}
                    </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Default Supplier</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{product.supplier?.name || 'Unknown'}</div>
                </div>
            </div>

            <BatchManagementTable product={serializedProduct} />

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Offer & Discount History</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Tracking how much offer was given for this product in past sales.
                </p>

                {serializedProduct.saleItems.filter((s: any) => Number(s.price) < Number(s.originalPrice)).length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                                <th style={{ padding: '0.75rem' }}>Date</th>
                                <th style={{ padding: '0.75rem' }}>Qty</th>
                                <th style={{ padding: '0.75rem' }}>Regular Price</th>
                                <th style={{ padding: '0.75rem' }}>Offer Price</th>
                                <th style={{ padding: '0.75rem' }}>Discount Given</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serializedProduct.saleItems
                                .filter((s: any) => Number(s.price) < Number(s.originalPrice))
                                .map((saleItem: any) => {
                                    const regular = Number(saleItem.originalPrice);
                                    const offer = Number(saleItem.price);
                                    const discount = regular - offer;
                                    const totalDiscount = discount * Number(saleItem.quantity);

                                    return (
                                        <tr key={saleItem.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                                {new Date(saleItem.sale.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{Number(saleItem.quantity).toString()}</td>
                                            <td style={{ padding: '0.75rem' }}>${regular.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>${offer.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--error)' }}>
                                                -${totalDiscount.toFixed(2)} total
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No offers or discounts have been applied to this product yet.
                    </div>
                )}
            </div>
        </div>
    );
}
