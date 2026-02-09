'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBill, getBills, deleteBill } from './actions';

export default function BillsPage() {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    async function loadBills() {
        setLoading(true);
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const data = await getBills(start, end);
            setBills(data);
        } catch (e: any) {
            console.error('Error loading bills:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBills();
    }, [startDate, endDate]);

    const totalAmount = bills.reduce((acc, b) => acc + b.amount, 0);

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Admin</Link>
                    <h1 style={{ margin: '0.5rem 0 0' }}>Bill Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Store and track your expense bills when buying stock.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {/* 1. New Bill Form */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem' }}>Record New Bill</h3>
                    <form action={async (formData) => {
                        setSubmitting(true);
                        try {
                            await createBill(formData);
                            loadBills();
                            (document.getElementById('bill-form') as HTMLFormElement).reset();
                            alert('Bill saved successfully!');
                        } catch (e) {
                            alert('Error saving bill');
                        } finally {
                            setSubmitting(false);
                        }
                    }} id="bill-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Store Name</label>
                            <input name="store" type="text" className="input" style={{ width: '100%' }} required placeholder="e.g. Costco, Local Supplier" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Amount</label>
                                <input name="amount" type="number" step="0.01" className="input" style={{ width: '100%' }} required placeholder="0.00" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Date</label>
                                <input name="date" type="date" className="input" style={{ width: '100%' }} required defaultValue={today} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Bill Image</label>
                            <input name="billImage" type="file" accept="image/*" className="input" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Important Items / Notes</label>
                            <textarea name="notes" className="input" style={{ width: '100%', minHeight: '80px', paddingTop: '0.5rem' }} placeholder="List important items or any notes..."></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '3.5rem' }} disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Bill'}
                        </button>
                    </form>
                </div>

                {/* 2. Bill History & Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>From</label>
                            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>To</label>
                            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '140px', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total for Period</div>
                            <b style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>${totalAmount.toFixed(2)}</b>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Bill History</h3>
                        </div>
                        <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--surface-hover)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>Date & Store</th>
                                        <th style={{ padding: '1rem' }}>Amount</th>
                                        <th style={{ padding: '1rem' }}>Image</th>
                                        <th style={{ padding: '1rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                                    ) : bills.length === 0 ? (
                                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bills found.</td></tr>
                                    ) : (
                                        bills.map(bill => (
                                            <tr key={bill.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{bill.store}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(bill.date).toLocaleDateString()}</div>
                                                    {bill.notes && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.25rem', fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.notes}</div>}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <b style={{ color: 'var(--primary)' }}>${bill.amount.toFixed(2)}</b>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {bill.imagePath ? (
                                                        <Link href={bill.imagePath} target="_blank" className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>View</Link>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Delete this bill?')) {
                                                                await deleteBill(bill.id);
                                                                loadBills();
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem' }}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
