'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerProps {
    onScan: (barcode: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
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

                // Request high resolution for better 1D barcode detection
                const videoConstraints = {
                    facingMode: "environment",
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                };

                await html5QrCode.start(
                    videoConstraints,
                    config as any,
                    (decodedText) => {
                        onScan(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // ignored
                    }
                );
                setIsScanning(true);
            } catch (err) {
                console.error("Unable to start scanning", err);
            }
        };

        const stopScanner = async () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                try {
                    await scannerRef.current.stop();
                    setIsScanning(false);
                } catch (err) {
                    console.error("Failed to stop scanner", err);
                }
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, [onScan]);

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }
    };

    return (
        <div className="scanner-root">
            <div className="scanner-frame">
                <div id="reader"></div>
                {isScanning && <div className="scanner-laser"></div>}
            </div>

            <p className="scanner-tip">
                💡 <b>Alignment:</b> Place the red line across the <b>entire</b> barcode.
                Move slowly and ensure good lighting.
            </p>

            <style jsx>{`
                .scanner-root {
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .scanner-frame {
                    position: relative;
                    width: 100%;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    background: #000;
                    border: 2px solid var(--primary);
                }
                #reader {
                    width: 100%;
                    min-height: 300px;
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
                    0%, 100% { transform: translateY(-40px); opacity: 0.3; }
                    50% { transform: translateY(40px); opacity: 1; }
                }
                .scanner-tip {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 1rem;
                    text-align: center;
                    background: var(--surface);
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                }
            `}</style>
        </div>
    );
}
