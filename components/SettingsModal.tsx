import React, { useState, useEffect } from 'react';
import { X, Save, Key, AlertTriangle, CheckCircle } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('GEMINI_API_KEY') || '';
            setApiKey(storedKey);
            setStatus('idle');
        }
    }, [isOpen]);

    const handleSave = () => {
        setStatus('saving');
        // Basic validation
        if (!apiKey.trim()) {
            localStorage.removeItem('GEMINI_API_KEY');
        } else {
            localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
        }

        setTimeout(() => {
            setStatus('saved');
            setTimeout(() => {
                onSave();
                onClose();
            }, 500);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-market-card border border-market-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-market-border bg-market-card/50">
                    <div className="flex items-center gap-2 text-white font-bold">
                        <Key size={18} className="text-market-accent" />
                        <span>إعدادات النظام</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-market-muted hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-market-muted flex items-center justify-between">
                            <span>مفتاح Gemini API</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Google AI Studio</span>
                        </label>

                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-black/20 border border-market-border rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-market-accent transition-colors font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-3 text-market-muted hover:text-white transition-colors"
                            >
                                {/* Simple toggle icon or text */}
                                <span className="text-xs font-bold">{showKey ? 'H' : 'S'}</span>
                            </button>
                        </div>

                        <p className="text-xs text-market-muted leading-relaxed">
                            سيتم تخزين المفتاح محلياً في متصفحك (Local Storage) ولن يتم مشاركته مع أي طرف ثالث سوى Google Generative AI أثناء التحليل.
                        </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                        <div className="text-xs text-yellow-200/80">
                            <p className="font-bold mb-1">تنبيه أمني</p>
                            تأكد من استخدام مفتاح صالح. إذا واجهت أخطاء 400، فهذا يعني غالباً أن المفتاح غير مفعل أو غير صحيح.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-market-border bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-market-muted hover:text-white transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={status === 'saving'}
                        className={`
              px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
              ${status === 'saved'
                                ? 'bg-green-500 text-white'
                                : 'bg-market-accent hover:bg-blue-600 text-white'}
            `}
                    >
                        {status === 'saving' && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {status === 'saved' && <CheckCircle size={16} />}
                        {status === 'idle' && 'حفظ الإعدادات'}
                        {status === 'saved' && 'تم الحفظ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
