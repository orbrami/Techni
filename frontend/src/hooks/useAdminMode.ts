'use client';
import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { adminAPI, setAdminTokenHeader, clearAdminTokenHeader } from '@/lib/api';
import toast from 'react-hot-toast';

export function useAdminMode() {
  const [tapCount, setTapCount] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const { isAdminMode, setAdminMode } = useAuthStore();

  const handleCornerTap = useCallback(() => {
    setTapCount((prev) => {
      const newCount = prev + 1;
      
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setTapCount(0), 2000);
      
      if (newCount >= 7) {
        setTapCount(0);
        setShowCodeModal(true);
      }
      
      return newCount;
    });
  }, []);

  const activateAdmin = async (code: string): Promise<boolean> => {
    try {
      const res = await adminAPI.verifyCode(code);
      const { adminToken } = res.data;
      setAdminMode(true, adminToken);
      setAdminTokenHeader(adminToken);
      setShowCodeModal(false);
      toast.success('מצב מנהל הופעל! 🔐');
      return true;
    } catch {
      toast.error('קוד שגוי');
      return false;
    }
  };

  const deactivateAdmin = () => {
    setAdminMode(false);
    clearAdminTokenHeader();
    toast.success('יצאת ממצב מנהל');
  };

  return {
    tapCount,
    showCodeModal,
    setShowCodeModal,
    handleCornerTap,
    activateAdmin,
    deactivateAdmin,
    isAdminMode,
  };
}
