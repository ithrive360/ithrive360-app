import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X } from 'lucide-react';

export default function LiveBarcodeScanner({ onScan, onClose }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const readerRef = useRef(null);

    useEffect(() => {
        let controls = null;

        const startScanner = async () => {
            try {
                // Yuka's secret is high resolution + continuous autofocus.
                // We instruct ZXing to ask the device for a 1080p feed instead of the default 480p/720p.
                readerRef.current = new BrowserMultiFormatReader();

                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920, min: 1280 },
                        height: { ideal: 1080, min: 720 },
                        advanced: [{ focusMode: "continuous" }]
                    }
                };

                controls = await readerRef.current.decodeFromConstraints(
                    constraints,
                    videoRef.current,
                    (result, err) => {
                        if (result && result.text) {
                            // Successfully decoded
                            if (controls) {
                                controls.stop();
                            }
                            onScan({ success: true, code: result.text });
                        }
                        if (err && err.name !== 'NotFoundException') {
                            // Suppress the constant "not found" noise
                            console.warn('Barcode scanning error:', err);
                        }
                    }
                );

            } catch (err) {
                console.error('Camera access error:', err);
                setError('Could not access the camera. Please check permissions.');
            }
        };

        startScanner();

        // Cleanup on unmount
        return () => {
            if (controls) {
                controls.stop();
            }
            if (readerRef.current) {
                readerRef.current.reset();
            }
            // Aggressive manual hardware destruction to prevent "black screen" deadlocks on re-open
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col pt-safe">
            <div className="flex justify-between items-center p-4">
                <h3 className="text-white font-semibold">Scan Barcode</h3>
                <button
                    onClick={onClose}
                    className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 relative">
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white bg-gray-900 mx-4 rounded-xl border border-gray-700">
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />

                        {/* Target Reticle Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-48 border-2 border-emerald-500 rounded-lg relative">
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-500/50 -translate-y-1/2 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                            </div>
                        </div>
                        <div className="absolute bottom-12 left-0 right-0 text-center">
                            <p className="text-white/80 font-medium">Position barcode inside the frame.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
