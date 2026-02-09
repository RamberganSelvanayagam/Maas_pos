'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFinancialSummary, getInventoryIntelligence, getProductSalesDetail, getDateWiseSales, getInventorySpending } from '../actions';

export default function ReportsPage() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
    const [financial, setFinancial] = useState<any>(null);
    const [inventory, setInventory] = useState<any>(null);
    const [productSales, setProductSales] = useState<any[]>([]);
    const [dailySales, setDailySales] = useState<any[]>([]);
    const [spending, setSpending] = useState<{ dailySpending: Record<string, number>, totalSpending: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days + 1);
            startDate.setHours(0, 0, 0, 0);

            const [fin, inv, prod, daily, spend] = await Promise.all([
                getFinancialSummary(days),
                getInventoryIntelligence(),
                getProductSalesDetail(startDate),
                getDateWiseSales(startDate, new Date()),
                getInventorySpending(startDate, new Date())
            ]);

            setFinancial(fin);
            setInventory(inv);
            setProductSales(prod);
            setDailySales(daily);
            setSpending(spend);
            setLoading(false);
        }
        loadData();
    }, [period]);

    if (loading || !financial) {
        return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading Reports Intelligence...</div>;
    }

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Admin</Link>
                    <h1 style={{ margin: '0.5rem 0 0' }}>Business Intelligence</h1>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-hover)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    {(['today', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`btn ${period === p ? 'btn-primary' : ''}`}
                            style={{
                                padding: '0.4rem 1rem',
                                fontSize: '0.8rem',
                                background: period === p ? 'var(--primary)' : 'transparent',
                                color: period === p ? 'white' : 'var(--text-main)',
                                border: 'none'
                            }}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* 1. Revenue & Profit Card */}
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Financial Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span>Revenue</span>
                            <b style={{ fontSize: '1.25rem' }}>${financial.revenue.toFixed(2)}</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--success)' }}>
                            <span>Gross Profit (Sales)</span>
                            <b style={{ fontSize: '1.25rem' }}>+${financial.profit.toFixed(2)}</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--error)' }}>
                            <span>Operational Loss (Wastage)</span>
                            <b>-${(financial.wastageCost || 0).toFixed(2)}</b>
                        </div>
                        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--accent)' }}>
                                <span style={{ fontWeight: 700 }}>Actual Profit</span>
                                <b style={{ fontSize: '1.5rem', fontWeight: 800 }}>${(financial.netProfit || financial.profit).toFixed(2)}</b>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <span>Offers Applied</span>
                            <b>-${(financial.totalDiscounts || 0).toFixed(2)}</b>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span>Profit Margin (Actual)</span>
                                <b>{financial.revenue > 0 ? ((financial.netProfit / financial.revenue) * 100).toFixed(1) : 0}%</b>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Inventory Value Card */}
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Inventory Intelligence</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span>Total Shelf Value</span>
                            <b style={{ fontSize: '1.25rem' }}>${inventory.totalStockValue.toFixed(2)}</b>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                            <div style={{ flex: 1, padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Out of Stock</div>
                                <b style={{ color: inventory.outOfStock > 0 ? 'var(--error)' : 'inherit' }}>{inventory.outOfStock}</b>
                            </div>
                            <div style={{ flex: 1, padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Low Stock</div>
                                <b style={{ color: inventory.lowStock > 0 ? 'var(--warning)' : 'inherit' }}>{inventory.lowStock}</b>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Operational Card */}
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Inventory Investment</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span>Total Spend</span>
                            <b style={{ fontSize: '1.25rem' }}>${(spending?.totalSpending || 0).toFixed(2)}</b>
                        </div>
                        <Link href="/admin/spending" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', textAlign: 'right', display: 'block', marginTop: '0.5rem' }}>
                            View Detailed Report →
                        </Link>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.5rem', borderRadius: '0.4rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', textAlign: 'center' }}>
                            Total cost of stock added in {period}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {/* Product Performance Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Product Performance</h3>
                        <span className="badge badge-success">{productSales.length} Products Sold</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--surface-hover)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Product</th>
                                    <th style={{ padding: '1rem' }}>Units</th>
                                    <th style={{ padding: '1rem' }}>Revenue</th>
                                    <th style={{ padding: '1rem' }}>Offer Given</th>
                                    <th style={{ padding: '1rem' }}>Profit</th>
                                    <th style={{ padding: '1rem' }}>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productSales.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.barcode}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{p.quantity}</td>
                                        <td style={{ padding: '1rem' }}>${p.revenue.toFixed(2)}</td>
                                        <td style={{ padding: '1rem', color: 'var(--error)' }}>
                                            {p.discount > 0 ? `-$${p.discount.toFixed(2)}` : '--'}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 600 }}>${p.profit.toFixed(2)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', minWidth: '40px' }}>
                                                    <div style={{ width: `${(p.profit / p.revenue) * 100}%`, height: '100%', background: 'var(--success)', borderRadius: '2px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem' }}>{((p.profit / p.revenue) * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Date-wise Breakdown */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Daily Sales Log</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--surface-hover)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Sales</th>
                                    <th style={{ padding: '1rem' }}>Revenue</th>
                                    <th style={{ padding: '1rem' }}>Inventory Added</th>
                                    <th style={{ padding: '1rem' }}>Total Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailySales.map((d, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                        <td style={{ padding: '1rem' }}>{d.transactions} txn</td>
                                        <td style={{ padding: '1rem' }}>${d.revenue.toFixed(2)}</td>
                                        <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 600 }}>
                                            ${(spending?.dailySpending[d.date] || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 600 }}>+${d.profit.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
