import prisma from '@/lib/prisma';
import DateFilter from './DateFilter';

export const dynamic = 'force-dynamic';

export default async function AdminBills(props: { searchParams: Promise<{ date?: string }> }) {
    const searchParams = await props.searchParams;
    const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];

    // Filter by the selected date (start of day to end of day)
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.totalAmount), 0);

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0 }}>Bills / Transaction Log</h1>
                <DateFilter initialDate={selectedDate} />
            </div>

            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Sales Summary for {new Date(selectedDate).toLocaleDateString()}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
            </div>

            {sales.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No transactions found for this date.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sales.map((sale: any) => (
                        <div key={sale.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>Order #{sale.id.slice(0, 8)}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(sale.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                                        ${Number(sale.totalAmount).toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        {sale.paymentMethod}
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.875rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                {sale.items.map((item: any) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>{Number(item.quantity)}x {item.product.name}</span>
                                        <span>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
