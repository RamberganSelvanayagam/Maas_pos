'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInventorySpendingDetails } from '../actions';

export default function SpendingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [details, setDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSpending() {
            setLoading(true);
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const data = await getInventorySpendingDetails(start, end);
            setDetails(data);
            setLoading(false);
        }
        loadSpending();
    }, [startDate, endDate]);

    const totalInvestment = details.reduce((acc, item) => acc + item.cost, 0);

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/admin/reports" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Reports</Link>
                <h1 style={{ margin: '0.5rem 0 0' }}>Inventory Investment Report</h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Track all stock intakes and financial commitments.</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                    />
                </div>
                <div className="card" style={{ flex: 1, minWidth: '200px', background: 'var(--primary)', color: 'white', padding: '1rem', border: 'none' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Total Investment</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>${totalInvestment.toFixed(2)}</div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Stock Intake History</h3>
                    <span className="badge badge-primary">{details.length} Batches Added</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--surface-hover)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Date/Time</th>
                                <th style={{ padding: '1rem' }}>Product</th>
                                <th style={{ padding: '1rem' }}>Supplier</th>
                                <th style={{ padding: '1rem' }}>Qty Added</th>
                                <th style={{ padding: '1rem' }}>Unit Cost</th>
                                <th style={{ padding: '1rem' }}>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td>
                                </tr>
                            ) : details.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No stock additions found for this range.</td>
                                </tr>
                            ) : (
                                details.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>{new Date(item.date).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.barcode}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{item.supplier}</td>
                                        <td style={{ padding: '1rem' }}>{item.quantity} {item.unit}</td>
                                        <td style={{ padding: '1rem' }}>${item.purchasePrice.toFixed(2)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>${item.cost.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
