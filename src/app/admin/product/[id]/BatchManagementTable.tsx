'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adjustBatchStock, markBatchAsWastage } from '@/app/inventory/actions';

export default function BatchManagementTable({ product }: { product: any }) {
    const router = useRouter();
    const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
    const [editBatchId, setEditBatchId] = useState<string | null>(null);
    const [adjQuantity, setAdjQuantity] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [confirmWastageId, setConfirmWastageId] = useState<string | null>(null);

    // Track physical counts for the audit summary
    const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});

    const handleEdit = (batch: any) => {
        setEditBatchId(batch.id);
        const currentCount = physicalCounts[batch.id] !== undefined ? physicalCounts[batch.id] : Number(batch.remainingQuantity);
        setAdjQuantity(currentCount);
    };

    const handleSave = async (batchId: string) => {
        setLoading(true);
        try {
            await adjustBatchStock(batchId, adjQuantity, 'Inventory Audit');
            setPhysicalCounts(prev => ({ ...prev, [batchId]: adjQuantity }));
            setEditBatchId(null);
            router.refresh(); // Sync parent summary cards
        } catch (error) {
            alert('Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    const handleWastage = async (batchId: string) => {
        // Optimistic update
        setPhysicalCounts(prev => ({ ...prev, [batchId]: 0 }));
        setLoading(true);
        try {
            const result = await markBatchAsWastage(batchId);
            setEditBatchId(null);
            router.refresh(); // Crucial for updating parent Total Stock card
        } catch (error) {
            alert('Failed to record wastage');
            // Rollback on error
            setPhysicalCounts(prev => {
                const newState = { ...prev };
                delete newState[batchId];
                return newState;
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate audit summary
    const currentMasterStock = Number(product.quantity);
    const totalPhysicalBatchStock = product.batches?.reduce((acc: number, b: any) => acc + (physicalCounts[b.id] !== undefined ? physicalCounts[b.id] : Number(b.remainingQuantity)), 0) || 0;
    const stockDifference = currentMasterStock - totalPhysicalBatchStock;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `}</style>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Stock Difference (On Hand vs Physical)
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stockDifference !== 0 ? 'var(--error)' : 'inherit' }}>
                        {stockDifference} {product.unit}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        If not zero, use <strong>Audit</strong> to correct physical reality
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Selling Price</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                        ${Number(product.sellingPrice).toFixed(2)}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a href="/admin/wastage" className="btn" style={{ width: '100%', background: 'linear-gradient(135deg, var(--error) 0%, #ff4d4d 100%)', color: 'white', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(255, 0, 0, 0.2)', transition: 'transform 0.2s' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        View Wastage Report
                    </a>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Added on</th>
                            <th style={{ padding: '1rem' }}>Expired date</th>
                            <th style={{ padding: '1rem' }}>Supplier</th>
                            <th style={{ padding: '1rem' }}>Cost price</th>
                            <th style={{ padding: '1rem' }}>Bought (Initial)</th>
                            <th style={{ padding: '1rem' }}>On Hand (Physical)</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {product.batches?.filter((b: any) => {
                            const systemStock = Number(b.remainingQuantity);
                            const physicalCount = physicalCounts[b.id] !== undefined ? physicalCounts[b.id] : systemStock;
                            return physicalCount > 0 || editBatchId === b.id;
                        }).map((batch: any) => {
                            const initialStock = Number(batch.initialQuantity);
                            const systemStock = Number(batch.remainingQuantity);
                            const physicalDisplay = physicalCounts[batch.id] !== undefined ? physicalCounts[batch.id] : systemStock;

                            return (
                                <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(batch.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', color: batch.expiryDate && new Date(batch.expiryDate) < new Date() ? 'var(--error)' : 'inherit' }}>
                                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'No expiry'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.875rem' }}>{batch.supplier?.name || '--'}</span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        ${Number(batch.purchasePrice).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{initialStock} {product.unit}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {editBatchId === batch.id ? (
                                            <input
                                                type="number"
                                                step="1"
                                                value={adjQuantity}
                                                onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                                                style={{ width: '80px', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--primary)' }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{physicalDisplay} {product.unit}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {editBatchId === batch.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleSave(batch.id)}
                                                        disabled={loading}
                                                    >
                                                        {loading ? '...' : 'Correct Stock'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--surface-hover)' }}
                                                        onClick={() => setEditBatchId(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ background: 'var(--surface-hover)', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleEdit(batch)}
                                                >
                                                    Audit
                                                </button>
                                            )}
                                            {confirmWastageId === batch.id ? (
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--accent)', color: 'white', animation: 'pulse 1s infinite' }}
                                                    onClick={() => {
                                                        handleWastage(batch.id);
                                                        setConfirmWastageId(null);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    Confirm Wastage?
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--error)', color: 'white' }}
                                                    onClick={() => setConfirmWastageId(batch.id)}
                                                    disabled={loading}
                                                >
                                                    Mark as Wastage
                                                </button>
                                            )}
                                            {confirmWastageId === batch.id && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm"
                                                    style={{ background: 'var(--surface-hover)', fontSize: '0.7rem' }}
                                                    onClick={() => setConfirmWastageId(null)}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Orphaned Stock Row */}
                        {stockDifference > 0 && (
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(239, 68, 68, 0.05)' }}>
                                <td style={{ padding: '1rem' }}>--</td>
                                <td style={{ padding: '1rem' }}>--</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: 'var(--error)', fontSize: '0.875rem', fontWeight: 600 }}>Unbatched Stock (Mismatch)</span>
                                </td>
                                <td style={{ padding: '1rem' }}>--</td>
                                <td style={{ padding: '1rem' }}>0 {product.unit}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--error)' }}>{stockDifference} {product.unit}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--error)', color: 'white' }}
                                        onClick={async () => {
                                            if (confirm(`Wastage the remaining ${stockDifference} unbatched items and sync total count?`)) {
                                                setLoading(true);
                                                try {
                                                    // Standardize by creating a dummy adjustment or updating master count directly 
                                                    // since there is no batch, we just audit the product count to match batches (which are 0)
                                                    // We'll use adjustBatchStock logic but applied to product if possible, 
                                                    // but cleaner to just use the existing server action on one of the batches? 
                                                    // Actually, we'll just alert the user to use Audit on a batch to bring it up, 
                                                    // OR we can provide a "Clear Orphaned Stock" action.
                                                    alert("To fix this, please Audit an existing batch or Intake new stock to match the physical reality. Alternatively, help us identify which batch these items belong to.");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                    >
                                        Correction needed
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
