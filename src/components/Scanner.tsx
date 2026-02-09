'use client';

import { useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerProps {
    onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
    useEffect(() => {
        // Narrow down format support for faster scanning
        const formatsToSupport = [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
        ];

        const config = {
            fps: 10,
            qrbox: { width: 300, height: 180 }, // Rectangular box is much better for barcodes
            aspectRatio: 1.0,
            formatsToSupport: formatsToSupport,
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true // Faster on modern mobile browsers
            }
        };

        const scanner = new Html5QrcodeScanner(
            "reader",
            config as any,
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
                scanner.clear().catch(err => console.warn("Failed to clear", err));
            },
            (error) => {
                // Silently ignore errors
            }
        );

        return () => {
            scanner.clear().catch(err => {
                // Ignore "Scanner not initialized" errors on cleanup
                if (!err.includes("not find element")) {
                    console.warn("Clean-up warning:", err);
                }
            });
        };
    }, [onScan]);

    return (
        <div className="scanner-container">
            <div id="reader" style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}></div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                💡 <b>Tip:</b> If the camera won't open on your phone, ensure you are using <b>HTTPS</b> (Deployment link).
                Hold the phone steady and about 15-20cm away from the barcode.
            </p>
            <style jsx>{`
                .scanner-container :global(#reader__scan_region) {
                    background: var(--surface) !important;
                }
                .scanner-container :global(button) {
                    background: var(--primary) !important;
                    color: white !important;
                    border: none !important;
                    padding: 0.5rem 1rem !important;
                    border-radius: var(--radius-md) !important;
                    cursor: pointer !important;
                    margin: 0.5rem 0 !important;
                }
                .scanner-container :global(select) {
                    padding: 0.4rem !important;
                    border-radius: var(--radius-sm) !important;
                    border: 1px solid var(--border) !important;
                    background: var(--surface) !important;
                    color: var(--text) !important;
                }
            `}</style>
        </div>
    );
}
