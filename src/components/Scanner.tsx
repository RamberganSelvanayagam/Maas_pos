'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerProps {
    onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
    const [status, setStatus] = useState<'IDLE' | 'STARTING' | 'SCANNING' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');
    const [rawError, setRawError] = useState('');
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
                    qrbox: { width: 300, height: 160 },
                    aspectRatio: 1.0,
                    formatsToSupport: formatsToSupport,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                // Use the most basic constraint first for maximum compatibility
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config as any,
                    (decodedText) => {
                        onScan(decodedText);
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate(100);
                        }
                    },
                    () => { }
                );

                setStatus('SCANNING');

                // Check for torch/flashlight
                try {
                    const capabilities = html5QrCode.getRunningTrackCapabilities();
                    if ((capabilities as any).torch) {
                        setHasTorch(true);
                    }
                } catch (e) {
                    console.warn("Torch check failed", e);
                }

            } catch (err: any) {
                console.error("Scanner Error:", err);
                setStatus('ERROR');
                setRawError(err.toString());

                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    setErrorMessage("Camera REQUIRES a secure connection (HTTPS).");
                } else if (err.includes("NotAllowedError") || err.includes("Permission denied")) {
                    setErrorMessage("Permission Denied: Please allow camera access in your browser settings.");
                } else if (err.includes("NotFoundError") || err.includes("Requested device not found")) {
                    setErrorMessage("No Camera Found: This device doesn't seem to have a back camera.");
                } else {
                    setErrorMessage("Could not start camera. See detail below:");
                }
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(e => console.warn("Cleanup error", e));
            }
        };
    }, [onScan]);

    const toggleTorch = async () => {
        if (!scannerRef.current || !hasTorch) return;
        try {
            const newState = !isTorchOn;
            await (scannerRef.current as any).applyVideoConstraints({
                advanced: [{ torch: newState }]
            });
            setIsTorchOn(newState);
        } catch (err) {
            console.error("Flashlight failed", err);
        }
    };

    return (
        <div className="scanner-root">
            <div className="scanner-frame">
                <div id="reader"></div>

                {status === 'STARTING' && (
                    <div className="status-overlay">
                        <div className="spinner"></div>
                        <p>Opening Camera...</p>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="status-overlay error">
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Oops!</h3>
                        <p style={{ fontWeight: 600 }}>{errorMessage}</p>
                        <div className="raw-error">{rawError}</div>
                        <button onClick={() => window.location.reload()} className="retry-btn">Try Again</button>
                    </div>
                )}

                {status === 'SCANNING' && (
                    <>
                        <div className="scanner-laser"></div>
                        {hasTorch && (
                            <button className="torch-btn" onClick={toggleTorch} style={{ background: isTorchOn ? 'var(--warning)' : 'rgba(0,0,0,0.6)' }}>
                                {isTorchOn ? 'Flash Off 💡' : 'Flash On 🔦'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <p className="scanner-tip">
                <b>Tip:</b> If the screen is black, refresh and click <b>"Allow"</b> when asked.
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
                    background: #000;
                    min-height: 250px;
                    border: 2px solid var(--primary);
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
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 1.5rem;
                    text-align: center;
                    z-index: 20;
                }
                .raw-error {
                    font-family: monospace;
                    font-size: 0.7rem;
                    background: rgba(255,255,255,0.1);
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin-top: 1rem;
                    max-width: 100%;
                    overflow-wrap: break-word;
                    color: #ccc;
                }
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .torch-btn {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    z-index: 30;
                    padding: 0.6rem 1rem;
                    border-radius: 2rem;
                    border: 1px solid white;
                    color: white;
                    font-size: 0.8rem;
                    cursor: pointer;
                }
                .retry-btn {
                    margin-top: 1.5rem;
                    padding: 0.6rem 1.5rem;
                    background: var(--primary);
                    border: none;
                    color: white;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                }
                .scanner-laser {
                    position: absolute;
                    top: 50%;
                    left: 5%;
                    right: 5%;
                    height: 2px;
                    background-color: #ff3e3e;
                    box-shadow: 0 0 10px #ff3e3e;
                    z-index: 10;
                    animation: laser-anim 2s infinite ease-in-out;
                }
                @keyframes laser-anim {
                    0%, 100% { transform: translateY(-30px); opacity: 0.2; }
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
