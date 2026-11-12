import React from 'react';

const motifs = ['heart', 'rose', 'lips', 'sparkle'] as const;

/** Decorative, deterministic particles avoid timers and render-time randomness. */
export function LoveParticles() {
  return (
    <div className="love-particles">
      {Array.from({ length: 64 }, (_, index) => {
        const motif = motifs[index % motifs.length];
        const style = {
          '--left': `${(index * 37 + 3) % 100}%`,
          '--size': `${18 + (index * 7) % 30}px`,
          '--duration': `${22 + (index * 11) % 24}s`,
          '--delay': `${-((index * 13) % 45)}s`,
          '--drift': `${((index * 19) % 120) - 60}px`,
          '--turn': `${index % 2 ? 100 : -100}deg`,
          '--rest': `${(index * 23) % 100}vh`,
          '--opacity': 0.16 + (index % 4) * 0.035,
        } as React.CSSProperties;

        return (
          <span key={index} className="love-particle" style={style}>
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              {motif === 'heart' && <path d="M24 41S5 29 5 16C5 5 18 3 24 13C30 3 43 5 43 16C43 29 24 41 24 41Z" fill="currentColor" fillOpacity=".3" />}
              {motif === 'rose' && <>
                <path d="M24 27C15 31 7 23 10 15C8 8 18 3 24 8C31 2 41 9 38 17C42 25 32 32 24 27Z" fill="currentColor" fillOpacity=".15" />
                <path d="M16 13C21 8 32 11 33 18C34 25 22 29 17 22C12 16 23 11 28 16C33 21 22 25 21 19C21 17 25 16 26 19M24 29C27 35 23 40 24 46M25 39C33 39 36 33 36 33C28 31 25 36 25 39ZM24 43C16 43 13 36 13 36C20 35 24 39 24 43Z" />
              </>}
              {motif === 'lips' && <>
                <path d="M3 24C10 21 13 11 20 15L24 18L28 15C35 11 38 21 45 24C37 29 34 37 24 37C14 37 11 29 3 24Z" fill="currentColor" fillOpacity=".25" />
                <path d="M3 24C12 24 18 21 24 24C30 21 36 24 45 24M13 27C20 31 28 31 35 27" />
              </>}
              {motif === 'sparkle' && <>
                <path d="M24 5C26 18 30 22 43 24C30 26 26 30 24 43C22 30 18 26 5 24C18 22 22 18 24 5Z" />
                <circle cx="38" cy="9" r="2" fill="currentColor" stroke="none" />
              </>}
            </svg>
          </span>
        );
      })}
    </div>
  );
}
