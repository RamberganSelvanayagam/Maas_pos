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
                // Focus and Clarity are keys for 1D barcodes
                const config = {
                    fps: 20,
                    qrbox: { width: 300, height: 160 },
                    aspectRatio: 1.0,
                    formatsToSupport: formatsToSupport,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                // Requesting better video constraints for mobile focus
                const videoConstraints: any = {
                    facingMode: "environment",
                    focusMode: "continuous",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                };

                await html5QrCode.start(
                    videoConstraints,
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
                    console.warn("Could not detect torch capabilities", e);
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
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop()
                    .then(() => {
                        console.log("Scanner stopped successfully");
                    })
                    .catch(err => {
                        console.warn("Stop error on unmount", err);
                    });
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
            console.error("Failed to toggle torch", err);
        }
    };

    return (
        <div className="scanner-root">
            <div className="scanner-frame">
                <div id="reader"></div>

                {status === 'STARTING' && (
                    <div className="status-overlay">Warming up camera...</div>
                )}

                {status === 'ERROR' && (
                    <div className="status-overlay error">
                        <p>{errorMessage}</p>
                        <button onClick={() => window.location.reload()} className="retry-btn">Retry Camera</button>
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
                <b>Tip:</b> If it's blurry, move the phone slowly back and forth (10-20cm distance).
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
                    border: 2px solid var(--primary);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
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
                    background: rgba(0,0,0,0.85);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                    z-index: 20;
                    font-size: 0.9rem;
                    backdrop-filter: blur(4px);
                }
                .status-overlay.error {
                    color: #ff8888;
                }
                .torch-btn {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    z-index: 30;
                    padding: 0.6rem 1rem;
                    border-radius: 2rem;
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .retry-btn {
                    margin-top: 1.5rem;
                    padding: 0.65rem 1.25rem;
                    background: var(--primary);
                    border: none;
                    color: white;
                    border-radius: var(--radius-md);
                    font-weight: 600;
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
                    0%, 100% { transform: translateY(-40px); opacity: 0.2; }
                    50% { transform: translateY(40px); opacity: 0.9; }
                }
                .scanner-tip {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 0.75rem;
                    text-align: center;
                    padding: 0 1rem;
                }
            `}</style>
        </div>
    );
}
