import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-[#300050] border border-[#D4AF37] rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4 relative overflow-hidden group">

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B4941F] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                        <Download className="text-[#300050]" size={24} strokeWidth={3} />
                    </div>
                    <div className="text-left">
                        <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Experiencia Completa</p>
                        <h3 className="text-white font-cofrade text-lg leading-none">Instalar Aplicación</h3>
                    </div>
                </div>

                <button
                    onClick={handleInstallClick}
                    className="bg-white text-[#300050] px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg min-w-max relative z-10"
                >
                    Instalar
                </button>

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-white/30 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default InstallPWA;
