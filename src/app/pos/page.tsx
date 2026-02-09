'use client';

import { useState, useEffect, useRef } from 'react';
import Scanner from '@/components/Scanner';
import { getProductByBarcode, getProductById, searchProducts } from '../inventory/actions';
import { processSale } from './actions';

export const dynamic = 'force-dynamic';

export default function POSPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [scanning, setScanning] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [showBatchModal, setShowBatchModal] = useState<{ productId: string, batches: any[], sellingPrice: number, replaceCartKey?: string } | null>(null);
    const [selectedBatchForOffer, setSelectedBatchForOffer] = useState<any | null>(null);
    const [offerInputs, setOfferInputs] = useState<{ price: string, percent: string }>({ price: '', percent: '' });

    // Handle clicks outside search results to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle search query changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                const results = await searchProducts(searchQuery);
                setSearchResults(results);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleScan = async (code: string) => {
        setScanning(false);
        const product = await getProductByBarcode(code);
        if (product) {
            addToCart(product);
        } else {
            alert('Product not found!');
        }
    };

    const addToCart = (product: any, batch?: any, replaceCartKey?: string) => {
        // 1. Determine available stock
        const totalAvailable = Number(product.quantity);
        const batchAvailable = batch ? Number(batch.remainingQuantity) : null;

        setCart(prev => {
            const itemKey = batch ? `${product.id}-${batch.id}` : product.id;

            // If we are replacing an existing item (e.g. regular -> offer)
            let currentCart = prev;
            if (replaceCartKey && replaceCartKey !== itemKey) {
                currentCart = prev.filter(item => item.cartKey !== replaceCartKey);
            }

            const existing = currentCart.find(item => item.cartKey === itemKey);
            const currentQtyInCart = existing ? existing.quantity : 0;
            const requestedQty = currentQtyInCart + 1;

            // 2. Enforce limits
            if (batchAvailable !== null && requestedQty > batchAvailable) {
                alert(`Cannot add more. Only ${batchAvailable} units left in this batch.`);
                return prev;
            }
            if (requestedQty > totalAvailable) {
                alert(`Cannot add more. Total stock: ${totalAvailable} ${product.unit}`);
                return prev;
            }

            if (existing) {
                return currentCart.map(item =>
                    item.cartKey === itemKey ? { ...item, quantity: requestedQty } : item
                );
            }

            const newItem = {
                cartKey: itemKey,
                productId: product.id,
                name: product.name,
                price: batch ? batch.offerPrice || product.sellingPrice : product.sellingPrice,
                purchasePrice: batch ? Number(batch.purchasePrice) : Number(product.purchasePrice),
                quantity: 1,
                unit: product.unit,
                batchId: batch?.id || null,
                batchExpiry: batch?.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : null,
                isOffer: !!batch,
                maxStock: batchAvailable ?? totalAvailable
            };

            return [...currentCart, newItem];
        });
        setSearchQuery('');
        setShowResults(false);
    };

    const updateQuantity = (cartKey: string, delta: number) => {
        setCart(prev => {
            const item = prev.find(i => i.cartKey === cartKey);
            if (!item) return prev;

            const newQty = Math.max(0, Number((item.quantity + delta).toFixed(3)));

            if (delta > 0 && newQty > item.maxStock) {
                alert(`Stock limit reached (${item.maxStock} ${item.unit})`);
                return prev;
            }

            return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: newQty } : i).filter(i => i.quantity > 0);
        });
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            await processSale(cart, paymentMethod);
            setCart([]);
            alert('Sale completed!');
        } catch (error) {
            console.error(error);
            alert('Failed to complete sale');
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ padding: '1rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>Point of Sale</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }} ref={searchRef}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search product by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        style={{ height: '3.5rem', paddingLeft: '1rem' }}
                    />
                    {showResults && searchResults.length > 0 && (
                        <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: '0.25rem', padding: '0.5rem', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                            {searchResults.map(product => (
                                <div
                                    key={product.id}
                                    className="search-result-item"
                                    onClick={() => addToCart(product)}
                                    style={{ padding: '0.75rem', borderRadius: '0.375rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                >
                                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{product.barcode} | {product.unit}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>${Number(product.sellingPrice).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    className={`btn ${scanning ? 'btn-error' : 'btn-primary'}`}
                    style={{ height: '3.5rem', width: '3.5rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setScanning(!scanning)}
                >
                    {scanning ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 12h8" /></svg>
                    )}
                </button>
            </div>

            {/* Manual Barcode Input Fallback */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Enter barcode manually..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleScan((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                    style={{ flexGrow: 1 }}
                />
                <button
                    className="btn btn-primary"
                    onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        handleScan(input.value);
                        input.value = '';
                    }}
                >
                    Add
                </button>
            </div>

            {scanning && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <Scanner onScan={handleScan} />
                    <button className="btn" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setScanning(false)}>Close Scanner</button>
                </div>
            )}

            <div className="glass-card" style={{ padding: '1rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Cart</h2>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Cart is empty</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: item.isOffer ? 'var(--surface-hover)' : 'transparent', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <div style={{ flexGrow: 1 }}>
                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {item.name}
                                        {item.isOffer && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Offer: {item.batchExpiry}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>${Number(item.price).toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {!item.isOffer && (
                                        <button
                                            onClick={async () => {
                                                const p = await getProductById(item.productId);
                                                if (p) {
                                                    setShowBatchModal({
                                                        productId: item.productId,
                                                        batches: p.batches,
                                                        sellingPrice: Number(p.sellingPrice),
                                                        replaceCartKey: item.cartKey
                                                    });
                                                }
                                            }}
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '0.25rem', border: '1px solid var(--warning)', color: 'var(--warning)', background: 'transparent' }}
                                        >
                                            Offer%
                                        </button>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                                        <button onClick={() => updateQuantity(item.cartKey, -1)} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setCart(prev => prev.map(i => i.cartKey === item.cartKey ? { ...i, quantity: val } : i));
                                            }}
                                            style={{ width: '60px', textAlign: 'center', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '25px' }}>{item.unit || 'pcs'}</span>
                                        <button onClick={() => updateQuantity(item.cartKey, 1)} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button
                            className={`btn ${paymentMethod === 'CASH' ? 'btn-primary' : ''}`}
                            style={{ background: paymentMethod === 'CASH' ? 'var(--primary)' : 'var(--surface-hover)', color: paymentMethod === 'CASH' ? 'white' : 'inherit', fontSize: '0.875rem' }}
                            onClick={() => setPaymentMethod('CASH')}
                        >
                            Cash
                        </button>
                        <button
                            className={`btn ${paymentMethod === 'CARD' ? 'btn-primary' : ''}`}
                            style={{ background: paymentMethod === 'CARD' ? 'var(--primary)' : 'var(--surface-hover)', color: paymentMethod === 'CARD' ? 'white' : 'inherit', fontSize: '0.875rem' }}
                            onClick={() => setPaymentMethod('CARD')}
                        >
                            Card
                        </button>
                    </div>

                    <button
                        className="btn btn-primary"
                        disabled={cart.length === 0 || loading}
                        style={{ width: '100%', height: '4rem', background: 'var(--success)' }}
                        onClick={handleCheckout}
                    >
                        {loading ? 'Processing...' : 'Complete Checkout'}
                    </button>
                </div>
            </div>

            {showBatchModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="card" style={{ maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{selectedBatchForOffer ? 'Configure Offer' : 'Select Batch for Offer'}</h3>
                            <button onClick={() => { setShowBatchModal(null); setSelectedBatchForOffer(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {!selectedBatchForOffer ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Select a specific batch to apply a discount. Stock will be reduced from this batch.</p>
                                {showBatchModal.batches.map(batch => (
                                    <button
                                        key={batch.id}
                                        className="card"
                                        style={{ textAlign: 'left', padding: '1rem', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface)' }}
                                        onClick={() => {
                                            setSelectedBatchForOffer(batch);
                                            setOfferInputs({ price: showBatchModal.sellingPrice.toString(), percent: '0' });
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Expiry: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}</span>
                                            <span className="badge badge-success">{Number(batch.remainingQuantity).toString()} left</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            Supplier: {batch.supplier?.name || 'Unknown'} | Added: {new Date(batch.createdAt).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))}
                                {showBatchModal.batches.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>
                                        No active batches found for this product.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: 'var(--surface-hover)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>Regular Price:</span>
                                        <b>${showBatchModal.sellingPrice.toFixed(2)}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                                        <span>Cost Price:</span>
                                        <b>${Number(selectedBatchForOffer.purchasePrice).toFixed(2)}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border)', fontWeight: 600, color: (parseFloat(offerInputs.price) - Number(selectedBatchForOffer.purchasePrice)) >= 0 ? 'var(--success)' : 'var(--error)' }}>
                                        <span>Est. Profit/unit:</span>
                                        <b>${(parseFloat(offerInputs.price) - Number(selectedBatchForOffer.purchasePrice)).toFixed(2)}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span>Selected Batch:</span>
                                        <span>Expiry: {selectedBatchForOffer.expiryDate ? new Date(selectedBatchForOffer.expiryDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Offer Price ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={offerInputs.price}
                                            onChange={(e) => {
                                                const price = parseFloat(e.target.value) || 0;
                                                const percent = (((showBatchModal.sellingPrice - price) / showBatchModal.sellingPrice) * 100).toFixed(2);
                                                setOfferInputs({ price: e.target.value, percent });
                                            }}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Discount (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={offerInputs.percent}
                                            onChange={(e) => {
                                                const percent = parseFloat(e.target.value) || 0;
                                                const price = (showBatchModal.sellingPrice * (1 - percent / 100)).toFixed(2);
                                                setOfferInputs({ price, percent: e.target.value });
                                            }}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '1rem', background: 'var(--success)' }}
                                    onClick={async () => {
                                        const p = await getProductById(selectedBatchForOffer.productId);
                                        if (p) {
                                            addToCart(p, { ...selectedBatchForOffer, offerPrice: parseFloat(offerInputs.price) }, showBatchModal.replaceCartKey);
                                            setShowBatchModal(null);
                                            setSelectedBatchForOffer(null);
                                        }
                                    }}
                                >
                                    Apply Offer
                                </button>
                                <button
                                    className="btn"
                                    style={{ width: '100%', marginTop: '0.75rem', background: 'var(--surface-hover)' }}
                                    onClick={() => setSelectedBatchForOffer(null)}
                                >
                                    Back to Batches
                                </button>
                            </div>
                        )}

                        {!selectedBatchForOffer && (
                            <button className="btn" style={{ width: '100%', marginTop: '1.5rem', background: 'var(--surface-hover)' }} onClick={() => setShowBatchModal(null)}>Cancel</button>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .search-result-item:hover {
                    background: var(--surface-hover);
                }
            `}</style>
        </div>
    );
}
