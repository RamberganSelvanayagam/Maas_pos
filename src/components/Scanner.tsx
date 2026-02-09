'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerProps {
    onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
    const [status, setStatus] = useState<'IDLE' | 'STARTING' | 'SCANNING' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const formatsToSupport = [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
        ];

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            setStatus('STARTING');
            try {
                // More compatible config
                const config = {
                    fps: 10,
                    qrbox: { width: 280, height: 160 },
                    aspectRatio: 1.0,
                    formatsToSupport: formatsToSupport
                };

                // Use simple environment facing mode for maximum compatibility
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config as any,
                    (decodedText) => {
                        onScan(decodedText);
                    },
                    (errorMessage) => {
                        // ignored during scanning
                    }
                );
                setStatus('SCANNING');
            } catch (err: any) {
                console.error("Scanner Error:", err);
                setStatus('ERROR');
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    setErrorMessage("Camera requires HTTPS. Please deploy to Vercel to use on mobile.");
                } else if (err.includes("NotAllowedError")) {
                    setErrorMessage("Camera permission denied. Please enable it in browser settings.");
                } else {
                    setErrorMessage("Could not start camera. Try refreshing or using a different browser.");
                }
            }
        };

        startScanner();

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.warn("Stop error", err));
            }
        };
    }, [onScan]);

    return (
        <div className="scanner-root">
            <div className="scanner-frame">
                <div id="reader"></div>

                {status === 'STARTING' && (
                    <div className="status-overlay">Starting Camera...</div>
                )}

                {status === 'ERROR' && (
                    <div className="status-overlay error">
                        <p>{errorMessage}</p>
                        <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
                    </div>
                )}

                {status === 'SCANNING' && (
                    <div className="scanner-laser"></div>
                )}
            </div>

            <p className="scanner-tip">
                Align the red line across the barcode.
                If it stays black, ensure you granted camera permissions.
            </p>

            <style jsx>{`
                .scanner-root {
                    width: 100%;
                    margin: 0 auto;
                }
                .scanner-frame {
                    position: relative;
                    width: 100%;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    background: #111;
                    min-height: 250px;
                    border: 2px solid var(--border);
                }
                #reader {
                    width: 100%;
                }
                .status-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                    z-index: 20;
                    font-size: 0.9rem;
                }
                .status-overlay.error {
                    color: #ff8888;
                }
                .retry-btn {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: var(--primary);
                    border: none;
                    color: white;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                }
                .scanner-laser {
                    position: absolute;
                    top: 50%;
                    left: 10%;
                    right: 10%;
                    height: 2px;
                    background-color: #ff3e3e;
                    box-shadow: 0 0 8px #ff3e3e;
                    z-index: 10;
                    animation: laser-anim 2s infinite ease-in-out;
                }
                @keyframes laser-anim {
                    0%, 100% { transform: translateY(-30px); opacity: 0.3; }
                    50% { transform: translateY(30px); opacity: 1; }
                }
                .scanner-tip {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 0.75rem;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
