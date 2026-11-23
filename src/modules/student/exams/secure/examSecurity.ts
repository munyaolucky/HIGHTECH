import type { ExamSecurityEvent, SecurityEventType } from './examTypes';

export interface SecurityOptions {
  onEvent: (event: ExamSecurityEvent) => void;
  blockCopy?: boolean;
  blockPaste?: boolean;
  blockCut?: boolean;
  blockContextMenu?: boolean;
  blockShortcuts?: boolean;
  trackTabSwitching?: boolean;
  trackFullscreenExit?: boolean;
}

export function isUnsupportedMobileOrSmallViewport(): {
  restricted: boolean;
  reason?: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { restricted: false };
  }
  const smallViewport = window.innerWidth > 0 && window.innerWidth < 640;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (smallViewport || mobileUa) {
    return {
      restricted: true,
      reason:
        'Mobile or narrow-screen browser detected. Desktop Chrome/Edge or a managed lab workstation in fullscreen is recommended for high-stakes exams.',
    };
  }
  return { restricted: false };
}

export function installExamSecurity({
  onEvent,
  blockCopy = true,
  blockPaste = true,
  blockCut = true,
  blockContextMenu = true,
  blockShortcuts = true,
  trackTabSwitching = true,
  trackFullscreenExit = true,
}: SecurityOptions): () => void {
  const report = (type: SecurityEventType, details?: string) => {
    onEvent({
      type,
      occurredAt: new Date().toISOString(),
      details,
    });
  };

  const prevent = (event: Event, type: SecurityEventType, details?: string) => {
    event.preventDefault();
    report(type, details);
  };

  const handleCopy = (event: ClipboardEvent) => {
    if (blockCopy) {
      prevent(event, 'COPY_ATTEMPT', 'Clipboard copy blocked during active exam.');
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (blockPaste) {
      prevent(event, 'PASTE_ATTEMPT', 'Clipboard paste blocked during active exam.');
    }
  };

  const handleCut = (event: ClipboardEvent) => {
    if (blockCut) {
      prevent(event, 'CUT_ATTEMPT', 'Clipboard cut blocked during active exam.');
    }
  };

  const handleContextMenu = (event: MouseEvent) => {
    if (blockContextMenu) {
      prevent(event, 'CONTEXT_MENU', 'Context menu disabled in Secure Exam Mode.');
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!blockShortcuts) return;

    const key = event.key.toLowerCase();
    const modifier = event.ctrlKey || event.metaKey;
    const target = event.target as HTMLElement | null;
    const isEditableTarget =
      target?.tagName === 'TEXTAREA' ||
      (target?.tagName === 'INPUT' &&
        ['text', 'search', 'email', 'url', 'tel'].includes(
          (target as HTMLInputElement).type || 'text'
        ));

    const blockedClipboardOrPageShortcut =
      (modifier && ['c', 'v', 'x', 'p', 's', 'u'].includes(key)) ||
      (modifier && key === 'a' && !isEditableTarget);

    const blockedDevTools =
      event.key === 'F12' ||
      (modifier && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key));

    const blockedAppSwitch = event.altKey && event.key === 'Tab';

    if (blockedClipboardOrPageShortcut || blockedDevTools || blockedAppSwitch) {
      prevent(
        event,
        'PROHIBITED_SHORTCUT',
        `Key: ${modifier ? 'Ctrl/Cmd+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`
      );
    }
  };

  const handleVisibility = () => {
    if (trackTabSwitching && document.visibilityState === 'hidden') {
      report('TAB_HIDDEN', 'Browser tab visibility became hidden.');
    }
  };

  const handleBlur = () => {
    if (trackTabSwitching) {
      report('WINDOW_BLUR', 'Exam window lost focus.');
    }
  };

  const handleFullscreen = () => {
    if (trackFullscreenExit && !document.fullscreenElement) {
      report('FULLSCREEN_EXIT', 'Exited fullscreen mode during active exam.');
    }
  };

  const handleDragStart = (event: DragEvent) => {
    if (blockCopy || blockCut) {
      prevent(event, 'DRAG_ATTEMPT', 'Drag-and-drop content extraction blocked.');
    }
  };

  const handleOffline = () => {
    report('CONNECTION_LOST', 'Network connection interrupted.');
  };

  const handleOnline = () => {
    report('CONNECTION_RESTORED', 'Network connection restored.');
  };

  document.addEventListener('copy', handleCopy);
  document.addEventListener('paste', handlePaste);
  document.addEventListener('cut', handleCut);
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('visibilitychange', handleVisibility);
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('fullscreenchange', handleFullscreen);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  return () => {
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('paste', handlePaste);
    document.removeEventListener('cut', handleCut);
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('visibilitychange', handleVisibility);
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('fullscreenchange', handleFullscreen);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}

export async function enterExamFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    return Boolean(document.fullscreenElement);
  } catch {
    return false;
  }
}

export async function exitExamFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    // Ignore fullscreen exit errors when already exited
  }
}
