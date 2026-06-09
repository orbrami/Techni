'use client';
import { useState, useRef, useEffect } from 'react';
import { Shield, X, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AdminCodeModalProps {
  onClose: () => void;
  onSubmit: (code: string) => Promise<boolean>;
}

export function AdminCodeModal({ onClose, onSubmit }: AdminCodeModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(false);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (value && index === 3) {
      const fullCode = [...newCode.slice(0, 3), value.slice(-1)].join('');
      if (fullCode.length === 4) handleSubmit(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode?: string) => {
    const codeStr = fullCode || code.join('');
    if (codeStr.length !== 4) return;

    setLoading(true);
    const success = await onSubmit(codeStr);
    setLoading(false);

    if (!success) {
      setError(true);
      setCode(['', '', '', '']);
      inputs.current[0]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl hover:bg-gray-100 text-gray-400"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-700 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="text-white" size={28} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">{t.adminMode}</h2>
          <p className="text-sm text-gray-500 mb-8">{t.enterAdminCode}</p>
        </div>

        <div className="flex gap-3 justify-center mb-6" dir="ltr">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-2xl font-black rounded-2xl border-2 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-400 bg-red-50 focus:ring-red-200 animate-bounce'
                  : digit
                  ? 'border-primary-400 bg-primary-50 focus:ring-primary-200'
                  : 'border-gray-200 bg-gray-50 focus:ring-primary-200 focus:border-primary-400'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-500 mb-4 animate-fade-in">{t.adminInvalid}</p>
        )}

        <button
          onClick={() => handleSubmit()}
          disabled={code.join('').length !== 4 || loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Lock size={16} />
              כניסה
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          המצב זמני ויאופס עם רענון הדף
        </p>
      </div>
    </div>
  );
}
