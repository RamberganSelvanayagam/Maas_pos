'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
    onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
                scanner.clear();
            },
            (error) => {
                // console.warn(error);
            }
        );

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [onScan]);

    return (
        <div id="reader" style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}></div>
    );
}
