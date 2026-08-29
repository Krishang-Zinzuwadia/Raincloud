"use client";

/**
 * Isolates the verified local DOOM Shareware v1.9 player from the desktop UI.
 * Its bundle contains the original DOOM.EXE and DOOM1.WAD from the portfolio.
 */
export function DoomPlayer() {
  return (
    <iframe
      allow="autoplay; fullscreen; gamepad"
      className="doom-player"
      src="/assets/doom/player.html"
      title="Original DOOM Shareware v1.9"
    />
  );
}
