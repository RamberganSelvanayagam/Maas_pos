'use client';

import { useState } from 'react';
import DivideBulkModal from './DivideBulkModal';

export default function DivideBulkButton({ product }: { product: any }) {
    const [showDividModal, setShowDivideModal] = useState(false);

    return (
        <>
            <button
                className="btn"
                style={{ background: 'var(--warning)', color: 'black', fontWeight: 600 }}
                onClick={() => setShowDivideModal(true)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M11 15h2a2 2 0 1 0 0-4h-3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h2" /><path d="M11 9h2" /><path d="M11 19h2" /><path d="M5 13v-3" /><path d="M19 13v-3" /></svg>
                Divide Stock
            </button>
            {showDividModal && <DivideBulkModal product={product} onClose={() => setShowDivideModal(false)} />}
        </>
    );
}
