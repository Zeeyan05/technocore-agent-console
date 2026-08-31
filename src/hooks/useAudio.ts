'use client';

import { useState, useEffect, useCallback } from 'react';
import { soundEffects } from '@/lib/audio';
import { getStoredAudioEnabled, setStoredAudioEnabled } from '@/lib/storage';

export function useAudio() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(getStoredAudioEnabled());
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      setStoredAudioEnabled(next);
      if (next) soundEffects.click();
      return next;
    });
  }, []);

  const playClick = useCallback(() => {
    if (enabled) soundEffects.click();
  }, [enabled]);

  const playSend = useCallback(() => {
    if (enabled) soundEffects.send();
  }, [enabled]);

  const playReceive = useCallback(() => {
    if (enabled) soundEffects.receive();
  }, [enabled]);

  const playVerifySuccess = useCallback(() => {
    if (enabled) soundEffects.verifySuccess();
  }, [enabled]);

  const playVerifyFail = useCallback(() => {
    if (enabled) soundEffects.verifyFail();
  }, [enabled]);

  return {
    enabled,
    toggle,
    playClick,
    playSend,
    playReceive,
    playVerifySuccess,
    playVerifyFail,
  };
}
