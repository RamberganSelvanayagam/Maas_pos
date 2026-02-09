import prisma from '@/lib/prisma';
import Link from 'next/link';
import ProductList from './ProductList';

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
    const rawProducts = await prisma.product.findMany({
        include: { category: true, supplier: true },
        orderBy: [
            { expiryDate: 'asc' }
        ]
    });

    const products = rawProducts.map(p => ({
        ...p,
        purchasePrice: Number(p.purchasePrice),
        sellingPrice: Number(p.sellingPrice),
        taxRate: Number(p.taxRate),
        quantity: Number(p.quantity)
    }));

    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    // Use (prisma as any) to workaround missing types in client
    const needToBuyItems = await (prisma as any).needToBuy?.findMany({
        where: { isBought: false },
        select: { productId: true }
    }) || [];

    const buyingListProductIds = new Set(needToBuyItems.map((item: any) => item.productId).filter(Boolean));

    // Fetch Today's Financial Summary
    const { getFinancialSummary } = await import('./actions');
    const todaySummary = await getFinancialSummary(1);

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href="/admin/need-to-buy" className="btn btn-primary" style={{ background: 'var(--secondary)' }}>Buying List</Link>
                    <Link href="/inventory" className="btn btn-primary">Stock Intake</Link>
                </div>
            </div>

            {/* Today's Briefing */}
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Today's Revenue</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>${todaySummary.revenue.toFixed(2)}</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'var(--border)', display: 'none' }}></div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Today's Actual Profit</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>+${todaySummary.netProfit.toFixed(2)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>After deducting ${todaySummary.wastageCost.toFixed(2)} wastage</div>
                </div>
                <Link href="/admin/reports" className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'var(--surface-hover)', borderRadius: '0.5rem' }}>
                    Full Report →
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/admin/bills" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Expense Bills</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store and track your buying receipts.</div>
                </Link>
                <Link href="/admin/sales" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Sales Log</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily transactions and history.</div>
                </Link>
                <Link href="/admin/wastage" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid var(--error)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Wastage Report</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inventory losses and expired stock.</div>
                </Link>
                <Link href="/admin/reports" className="card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Business Intelligence</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Profits, margins, and performance.</div>
                </Link>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Product Inventory</h2>
            <ProductList
                products={products}
                categories={categories}
                buyingListIds={Array.from(buyingListProductIds) as string[]}
            />
        </div>
    );
}
