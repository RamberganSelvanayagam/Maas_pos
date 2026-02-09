'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function DateFilter({ initialDate }: { initialDate: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (date: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('date', date);
        router.push(`/admin/bills?${params.toString()}`);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Select Date:</label>
            <input
                type="date"
                defaultValue={initialDate}
                onChange={(e) => handleChange(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'var(--background)' }}
            />
        </div>
    );
}
