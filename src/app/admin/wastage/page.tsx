'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWastageLogs } from '../actions';

export default function WastageReportPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getWastageLogs();
                setLogs(data);
            } catch (error) {
                console.error('Failed to load wastage logs:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const totalLoss = logs.reduce((acc, log) => acc + log.cost, 0);

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Admin</Link>
                    <h1 style={{ margin: '0.5rem 0 0' }}>Wastage Report</h1>
                </div>
                <div className="glass-card" style={{ padding: '0.75rem 1.25rem', borderLeft: '4px solid var(--error)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Value Lost</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>${totalLoss.toFixed(2)}</div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading report...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--surface-hover)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Product</th>
                                <th style={{ padding: '1rem' }}>Quantity</th>
                                <th style={{ padding: '1rem' }}>Cost Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No wastage recorded yet.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {new Date(log.date).toLocaleDateString()}
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{log.productName}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.barcode}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{log.quantity}</td>
                                        <td style={{ padding: '1rem', color: 'var(--error)', fontWeight: 600 }}>
                                            -${log.cost.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
