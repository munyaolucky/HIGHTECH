import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  enterExamFullscreen,
  exitExamFullscreen,
  installExamSecurity,
  isUnsupportedMobileOrSmallViewport,
} from '../exams/secure/examSecurity';
import type { ExamSecurityEvent } from '../exams/secure/examTypes';

export interface UseExamSecurityOptions {
  enabled: boolean;
  requireFullscreen?: boolean;
  blockCopy?: boolean;
  blockPaste?: boolean;
  blockCut?: boolean;
  blockContextMenu?: boolean;
  blockShortcuts?: boolean;
  trackTabSwitching?: boolean;
  trackFullscreenExit?: boolean;
  onSecurityEvent?: (event: ExamSecurityEvent) => void;
}

export interface UseExamSecurityState {
  isFullscreen: boolean;
  isWindowFocused: boolean;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  clipboardViolationCount: number;
  recentEvents: ExamSecurityEvent[];
  mobileRestriction: { restricted: boolean; reason?: string };
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<void>;
  resetCounters: () => void;
}

export function useExamSecurity({
  enabled,
  requireFullscreen = true,
  blockCopy = true,
  blockPaste = true,
  blockCut = true,
  blockContextMenu = true,
  blockShortcuts = true,
  trackTabSwitching = true,
  trackFullscreenExit = true,
  onSecurityEvent,
}: UseExamSecurityOptions): UseExamSecurityState {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [clipboardViolationCount, setClipboardViolationCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<ExamSecurityEvent[]>([]);

  const mobileRestriction = useMemo(() => isUnsupportedMobileOrSmallViewport(), []);
  const onEventRef = useRef(onSecurityEvent);

  useEffect(() => {
    onEventRef.current = onSecurityEvent;
  }, [onSecurityEvent]);

  const enterFullscreen = useCallback(async () => {
    const entered = await enterExamFullscreen();
    if (typeof document !== 'undefined') {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    return entered;
  }, []);

  const exitFullscreen = useCallback(async () => {
    await exitExamFullscreen();
    if (typeof document !== 'undefined') {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }, []);

  const resetCounters = useCallback(() => {
    setTabSwitchCount(0);
    setFullscreenExitCount(0);
    setClipboardViolationCount(0);
    setRecentEvents([]);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (typeof document !== 'undefined') {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setIsWindowFocused(!document.hidden);
    }

    const handleVisibilityRestore = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setIsWindowFocused(true);
      }
    };
    const handleWindowFocus = () => {
      setIsWindowFocused(true);
    };
    const handleFullscreenSync = () => {
      if (typeof document !== 'undefined') {
        setIsFullscreen(Boolean(document.fullscreenElement));
      }
    };

    const cleanup = installExamSecurity({
      blockCopy,
      blockPaste,
      blockCut,
      blockContextMenu,
      blockShortcuts,
      trackTabSwitching,
      trackFullscreenExit,
      onEvent: (event) => {
        setRecentEvents((prev) => [event, ...prev].slice(0, 25));

        if (event.type === 'TAB_HIDDEN') {
          setTabSwitchCount((n) => n + 1);
          setIsWindowFocused(false);
        } else if (event.type === 'WINDOW_BLUR') {
          setIsWindowFocused(false);
        } else if (event.type === 'FULLSCREEN_EXIT') {
          setFullscreenExitCount((n) => n + 1);
          setIsFullscreen(false);
        } else if (
          event.type === 'COPY_ATTEMPT' ||
          event.type === 'PASTE_ATTEMPT' ||
          event.type === 'CUT_ATTEMPT' ||
          event.type === 'CONTEXT_MENU' ||
          event.type === 'PROHIBITED_SHORTCUT' ||
          event.type === 'DRAG_ATTEMPT'
        ) {
          setClipboardViolationCount((n) => n + 1);
        }

        onEventRef.current?.(event);
      },
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityRestore);
      document.addEventListener('fullscreenchange', handleFullscreenSync);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
    }

    if (requireFullscreen && typeof document !== 'undefined' && !document.fullscreenElement) {
      void enterExamFullscreen().then((entered) => {
        if (entered) setIsFullscreen(true);
      });
    }

    return () => {
      cleanup();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityRestore);
        document.removeEventListener('fullscreenchange', handleFullscreenSync);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
      }
    };
  }, [
    enabled,
    requireFullscreen,
    blockCopy,
    blockPaste,
    blockCut,
    blockContextMenu,
    blockShortcuts,
    trackTabSwitching,
    trackFullscreenExit,
  ]);

  return {
    isFullscreen,
    isWindowFocused,
    tabSwitchCount,
    fullscreenExitCount,
    clipboardViolationCount,
    recentEvents,
    mobileRestriction,
    enterFullscreen,
    exitFullscreen,
    resetCounters,
  };
}

export default useExamSecurity;
