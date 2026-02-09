'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerProps {
    onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
    const [status, setStatus] = useState<'IDLE' | 'STARTING' | 'SCANNING' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasTorch, setHasTorch] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
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
                const config = {
                    fps: 15,
                    qrbox: { width: 300, height: 180 },
                    aspectRatio: 1.0,
                    formatsToSupport: formatsToSupport,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config as any,
                    (decodedText) => {
                        onScan(decodedText);
                        // Brief haptic feedback if possible
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate(100);
                        }
                    },
                    (errorMessage) => {
                        // ignored
                    }
                );

                setStatus('SCANNING');

                // Check for torch support
                const capabilities = html5QrCode.getRunningTrackCapabilities();
                if ((capabilities as any).torch) {
                    setHasTorch(true);
                }

            } catch (err: any) {
                console.error("Scanner Error:", err);
                setStatus('ERROR');
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    setErrorMessage("Camera requires HTTPS. Please use the Vercel link on mobile.");
                } else {
                    setErrorMessage("Could not start camera. Please ensure permissions are granted.");
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

    const toggleTorch = async () => {
        if (!scannerRef.current || !hasTorch) return;
        try {
            const newState = !isTorchOn;
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: newState }] as any
            });
            setIsTorchOn(newState);
        } catch (err) {
            console.error("Failed to toggle torch", err);
        }
    };

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
                    <>
                        <div className="scanner-laser"></div>
                        {hasTorch && (
                            <button className="torch-btn" onClick={toggleTorch} style={{ background: isTorchOn ? 'var(--warning)' : 'rgba(0,0,0,0.5)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 17h.01" /><path d="M18 14h.01" /><path d="M12 21h.01" /><path d="M11 3l9 9-9 9-9-9 9-9z" />
                                </svg>
                                {isTorchOn ? 'Flash Off' : 'Flash On'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <p className="scanner-tip">
                Align the red line across the barcode.
                Use the <b>Flash</b> button in dark areas.
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
                .torch-btn {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    z-index: 30;
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--radius-md);
                    border: 1px solid white;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
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
