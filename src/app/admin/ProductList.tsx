'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { addToBuyingList } from './actions';

export default function ProductList({
    products,
    categories,
    buyingListIds = []
}: {
    products: any[],
    categories: any[],
    buyingListIds?: string[]
}) {
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState(searchParams.get('filter') || 'all');
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Update filter if query param changes
    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter) setStockFilter(filter);
    }, [searchParams]);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
        const stock = Number(p.quantity);
        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'instock' && stock > 0) ||
            (stockFilter === 'outofstock' && stock <= 0);
        return matchesSearch && matchesCategory && matchesStock;
    });

    const handleSelect = (id: string) => {
        setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSendToBuyingList = async () => {
        const toAdd = products
            .filter(p => selectedIds[p.id])
            .map(p => ({
                productId: p.id,
                name: p.name,
                barcode: p.barcode,
                quantity: Math.floor(parseFloat(quantities[p.id])) || 1,
                unit: p.unit
            }));

        if (toAdd.length === 0) {
            alert('Please select items first');
            return;
        }

        setLoading(true);
        try {
            await addToBuyingList(toAdd);
            alert('Success! Items added to the Buying List.');
            setSelectedIds({});
            setQuantities({});
        } catch (error) {
            console.error(error);
            alert('Failed to add items');
        } finally {
            setLoading(false);
        }
    };

    const selectedCount = Object.values(selectedIds).filter(Boolean).length;

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                >
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
                >
                    <option value="all">Stock Levels</option>
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                </select>

                {selectedCount > 0 && (
                    <button
                        className="btn btn-primary"
                        onClick={handleSendToBuyingList}
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : `Add ${selectedCount} to Buying List`}
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                            <th style={{ padding: '1rem', width: '40px' }}>Select</th>
                            <th style={{ padding: '1rem' }}>Product & Category</th>
                            <th style={{ padding: '1rem' }}>Barcode</th>
                            <th style={{ padding: '1rem' }}>Price</th>
                            <th style={{ padding: '1rem' }}>Stock</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            {selectedCount > 0 && <th style={{ padding: '1rem' }}>Order Qty</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={!!selectedIds[product.id]}
                                        onChange={() => handleSelect(product.id)}
                                    />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link href={`/admin/product/${product.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                                        {product.name}
                                    </Link>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.category?.name || 'No Category'}</div>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{product.barcode}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>
                                    ${Number(product.sellingPrice).toFixed(2)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span className={`badge ${Number(product.quantity) < 5 ? 'badge-error' : 'badge-success'}`}>
                                        {Number(product.quantity).toString()} {product.unit}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {buyingListIds.includes(product.id) ? (
                                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>In Buying List</span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>--</span>
                                    )}
                                </td>
                                {selectedCount > 0 && (
                                    <td style={{ padding: '1rem' }}>
                                        {selectedIds[product.id] && (
                                            <input
                                                type="number"
                                                value={quantities[product.id] || '1'}
                                                step="1"
                                                min="1"
                                                onChange={(e) => setQuantities(prev => ({ ...prev, [product.id]: e.target.value }))}
                                                style={{ width: '60px', padding: '0.3rem', borderRadius: '0.3rem', border: '1px solid var(--border)' }}
                                            />
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
