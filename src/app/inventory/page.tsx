'use client';

import { useState } from 'react';
import Scanner from '@/components/Scanner';
import { getProductByBarcode, upsertProduct } from './actions';

export const dynamic = 'force-dynamic';

export default function InventoryPage() {
    const [barcode, setBarcode] = useState('');
    const [isExisting, setIsExisting] = useState(false);
    const [productData, setProductData] = useState({
        name: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '1',
        unit: 'pcs',
        supplier: '',
        category: '',
        expiryDate: '',
        noExpiry: false,
        createdAt: ''
    });
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleScan = async (code: string) => {
        setBarcode(code);
        setScanning(false);
        setLoading(true);
        const existing = await getProductByBarcode(code);
        if (existing) {
            setIsExisting(true);
            setProductData({
                name: existing.name,
                purchasePrice: existing.purchasePrice.toString(),
                sellingPrice: existing.sellingPrice.toString(),
                quantity: '1',
                unit: (existing as any).unit || 'pcs',
                supplier: existing.supplier?.name || '',
                category: existing.category?.name || '',
                expiryDate: '', // Do not auto-fill old expiry date
                noExpiry: false, // Force manual entry for new batch
                createdAt: new Date(existing.createdAt).toLocaleString()
            });
        } else {
            setIsExisting(false);
            setProductData({
                name: '',
                purchasePrice: '',
                sellingPrice: '',
                quantity: '1',
                unit: 'pcs',
                supplier: '',
                category: '',
                expiryDate: '',
                noExpiry: false,
                createdAt: ''
            });
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>Inventory Intake</h1>

            {!scanning ? (
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1.5rem', height: '4rem' }}
                    onClick={() => setScanning(true)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>
                    Scan Barcode
                </button>
            ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                    <Scanner onScan={handleScan} />
                    <button
                        className="btn"
                        style={{ width: '100%', marginTop: '0.5rem', background: 'var(--surface-hover)' }}
                        onClick={() => setScanning(false)}
                    >
                        Cancel
                    </button>
                </div>
            )}

            <form action={async (formData) => {
                setLoading(true);
                await upsertProduct(formData);
                setBarcode('');
                setIsExisting(false);
                setProductData({
                    name: '',
                    purchasePrice: '',
                    sellingPrice: '',
                    quantity: '1',
                    unit: 'pcs',
                    supplier: '',
                    category: '',
                    expiryDate: '',
                    noExpiry: false,
                    createdAt: ''
                });
                setLoading(false);
                alert('Inventory updated!');
            }} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {productData.createdAt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '-0.5rem' }}>
                        Initial Entry: {productData.createdAt}
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Barcode</label>
                    <input
                        type="text"
                        name="barcode"
                        value={barcode}
                        onChange={(e) => {
                            setBarcode(e.target.value);
                            if (e.target.value.length >= 8) { // Typical barcode length
                                handleScan(e.target.value);
                            }
                        }}
                        onBlur={() => {
                            if (barcode) handleScan(barcode);
                        }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Product Name</label>
                    <input
                        type="text"
                        name="name"
                        value={productData.name}
                        onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                        readOnly={isExisting}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: isExisting ? 'var(--surface-hover)' : 'var(--background)',
                            color: isExisting ? 'var(--text-muted)' : 'inherit',
                            cursor: isExisting ? 'not-allowed' : 'text'
                        }}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Cost Price</label>
                        <input
                            type="number"
                            name="purchasePrice"
                            step="0.01"
                            value={productData.purchasePrice}
                            onChange={(e) => setProductData({ ...productData, purchasePrice: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Selling Price</label>
                        <input
                            type="number"
                            name="sellingPrice"
                            step="0.01"
                            value={productData.sellingPrice}
                            onChange={(e) => setProductData({ ...productData, sellingPrice: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Quantity</label>
                        <input
                            type="number"
                            name="quantity"
                            step="1"
                            min="0"
                            value={productData.quantity}
                            onChange={(e) => setProductData({ ...productData, quantity: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unit</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {['pcs', 'kg', 'g', 'box', 'liter', 'ml'].map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => !isExisting && setProductData({ ...productData, unit: u })}
                                    className={`btn ${productData.unit === u ? 'btn-primary' : ''}`}
                                    disabled={isExisting}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.8rem',
                                        background: productData.unit === u ? 'var(--primary)' : 'var(--surface-hover)',
                                        borderColor: productData.unit === u ? 'var(--primary)' : 'var(--border)',
                                        minWidth: '60px',
                                        opacity: isExisting && productData.unit !== u ? 0.5 : 1,
                                        cursor: isExisting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="unit" value={productData.unit} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Supplier</label>
                        <input
                            type="text"
                            name="supplier"
                            value={productData.supplier}
                            onChange={(e) => setProductData({ ...productData, supplier: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Category</label>
                    <input
                        type="text"
                        name="category"
                        value={productData.category}
                        onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                        readOnly={isExisting}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: isExisting ? 'var(--surface-hover)' : 'var(--background)',
                            color: isExisting ? 'var(--text-muted)' : 'inherit',
                            cursor: isExisting ? 'not-allowed' : 'text'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem' }}>Expiry Date</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                name="noExpiry"
                                id="noExpiry"
                                checked={productData.noExpiry}
                                onChange={(e) => setProductData({ ...productData, noExpiry: e.target.checked })}
                            />
                            <label htmlFor="noExpiry" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Expiry Date</label>
                        </div>
                    </div>
                    {!productData.noExpiry && (
                        <input
                            type="date"
                            name="expiryDate"
                            value={productData.expiryDate}
                            onChange={(e) => setProductData({ ...productData, expiryDate: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                            required={!productData.noExpiry}
                        />
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '1rem', height: '3.5rem' }}
                >
                    {loading ? 'Saving...' : 'Update Inventory'}
                </button>
            </form>
        </div>
    );
}
