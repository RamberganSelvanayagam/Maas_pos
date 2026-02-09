'use client';

import { useState } from 'react';
import { divideProduct } from '@/app/inventory/actions';

interface DivideBulkModalProps {
    product: any;
    onClose: () => void;
}

export default function DivideBulkModal({ product, onClose }: DivideBulkModalProps) {
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [quantityToMove, setQuantityToMove] = useState(1);
    const [targetBarcode, setTargetBarcode] = useState('');
    const [targetName, setTargetName] = useState(`${product.name} (Retail)`);
    const [targetPrice, setTargetPrice] = useState(Number(product.sellingPrice));
    const [loading, setLoading] = useState(false);

    const handleDivide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) return alert('Please select a batch');

        setLoading(true);
        try {
            await divideProduct(selectedBatchId, targetBarcode, quantityToMove, targetName, targetPrice);
            alert('Stock divided successfully');
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to divide stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handleDivide} className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1rem' }}>Divide Bulk Stock</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}> Move weight/quantity from a bulk batch to a retail product.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Select Source Batch</label>
                        <select
                            className="input"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Batch --</option>
                            {product.batches.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    Expiry: {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'} ({Number(b.remainingQuantity)} {product.unit} left)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Quantity to Move ({product.unit})</label>
                        <input
                            type="number"
                            step="0.001"
                            className="input"
                            value={quantityToMove}
                            onChange={(e) => setQuantityToMove(parseFloat(e.target.value))}
                            required
                        />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>Target Retail Product</h4>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Retail Barcode</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Scan or type retail barcode"
                                value={targetBarcode}
                                onChange={(e) => setTargetBarcode(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Retail Name</label>
                            <input
                                type="text"
                                className="input"
                                value={targetName}
                                onChange={(e) => setTargetName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Retail Price</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" className="btn" style={{ flex: 1, background: 'var(--surface-hover)' }} onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                        {loading ? 'Moving...' : 'Complete Division'}
                    </button>
                </div>
            </form>
        </div>
    );
}
