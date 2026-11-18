import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ScrollViewProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both';
  tone?: 'light' | 'dark' | 'navy';
  maxHeight?: string;
  snap?: boolean;
  hideScrollbar?: boolean;
  showEdgeFades?: boolean;
  showArrows?: boolean;
  fadeColor?: string;
  className?: string;
  innerClassName?: string;
  ariaLabel?: string;
}

export default function ScrollView({
  children,
  direction = 'vertical',
  tone = 'light',
  maxHeight,
  snap = false,
  hideScrollbar = false,
  showEdgeFades = true,
  showArrows = false,
  fadeColor,
  className = '',
  innerClassName = '',
  ariaLabel,
}: ScrollViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({
    start: false,
    end: false,
    top: false,
    bottom: false,
  });

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const canScrollLeft = el.scrollLeft > 4;
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    const canScrollTop = el.scrollTop > 4;
    const canScrollBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4;

    setEdges((prev) => {
      if (
        prev.start === canScrollLeft &&
        prev.end === canScrollRight &&
        prev.top === canScrollTop &&
        prev.bottom === canScrollBottom
      ) {
        return prev;
      }
      return {
        start: canScrollLeft,
        end: canScrollRight,
        top: canScrollTop,
        bottom: canScrollBottom,
      };
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => updateEdges());
    ro.observe(el);
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }
    return () => ro.disconnect();
  }, [updateEdges, children]);

  const scrollStep = (dir: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(220, Math.round(el.clientWidth * 0.68));
    el.scrollBy({
      left: dir === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };

  const overflowClass =
    direction === 'horizontal'
      ? 'scrollview-x'
      : direction === 'both'
      ? 'scrollview-both'
      : 'scrollview-y';

  const toneClass = tone === 'dark' || tone === 'navy' ? 'scrollview-dark' : '';
  const resolvedFadeBg =
    fadeColor ??
    (tone === 'dark'
      ? 'from-[#0b1f3b]'
      : tone === 'navy'
      ? 'from-[#092b5d]'
      : 'from-white');

  return (
    <div className={`relative group/scrollview ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateEdges}
        aria-label={ariaLabel}
        tabIndex={0}
        className={`${overflowClass} ${toneClass} ${
          snap && direction === 'horizontal' ? 'scrollview-snap-x' : ''
        } ${hideScrollbar ? 'scrollview-clean' : ''} ${
          maxHeight ?? ''
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0875e8]/40 rounded-lg ${innerClassName}`}
      >
        {children}
      </div>

      {/* EDGE AFFORDANCE FADES FOR VERTICAL OVERFLOW */}
      {showEdgeFades && (direction === 'vertical' || direction === 'both') && (
        <>
          {edges.top && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-0 left-0 right-2 h-5 bg-gradient-to-b ${resolvedFadeBg} to-transparent z-10`}
            />
          )}
          {edges.bottom && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t ${resolvedFadeBg} to-transparent z-10`}
            />
          )}
        </>
      )}

      {/* EDGE AFFORDANCE FADES FOR HORIZONTAL OVERFLOW */}
      {showEdgeFades && (direction === 'horizontal' || direction === 'both') && (
        <>
          {edges.start && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-0 bottom-1 left-0 w-8 bg-gradient-to-r ${resolvedFadeBg} to-transparent z-10`}
            />
          )}
          {edges.end && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-0 bottom-1 right-0 w-10 bg-gradient-to-l ${resolvedFadeBg} to-transparent z-10`}
            />
          )}
        </>
      )}

      {/* OPTIONAL HORIZONTAL STEPPER BUTTONS */}
      {showArrows && direction === 'horizontal' && (
        <>
          {edges.start && (
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollStep('prev')}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#092c60] border border-slate-200 shadow-md flex items-center justify-center transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {edges.end && (
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollStep('next')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#092c60] border border-slate-200 shadow-md flex items-center justify-center transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, scrollTop / docHeight)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (progress <= 0.01) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none bg-transparent no-print"
    >
      <progress
        value={Math.round(progress * 100)}
        max={100}
        className="w-full h-[3px] block appearance-none bg-transparent [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-[#0875e8] [&::-webkit-progress-value]:via-[#153b70] [&::-webkit-progress-value]:to-[#ffc400] [&::-moz-progress-bar]:bg-[#0875e8]"
      />
    </div>
  );
}

export function ScrollToTopButton({ lifted = false }: { lifted?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible((window.scrollY || document.documentElement.scrollTop) > 340);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-5 z-40 no-print w-10 h-10 rounded-full bg-[#092c60] hover:bg-[#0866d7] text-white border border-white/20 shadow-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        lifted ? 'bottom-24' : 'bottom-6'
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}
