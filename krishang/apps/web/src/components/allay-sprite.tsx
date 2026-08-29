type AllaySpriteProps = {
  busy: boolean;
};

export function AllaySprite({ busy }: AllaySpriteProps) {
  return (
    <svg
      aria-hidden="true"
      className={busy ? "allay-sprite is-busy" : "allay-sprite"}
      shapeRendering="crispEdges"
      viewBox="0 0 88 92"
    >
      <g className="allay-wing allay-wing-left">
        <path d="M28 24H16v7H9v28h7v8h15V52h5V31h-8z" />
        <path className="allay-wing-light" d="M18 34h10v22H18z" />
      </g>
      <g className="allay-wing allay-wing-right">
        <path d="M60 24h12v7h7v28h-7v8H57V52h-5V31h8z" />
        <path className="allay-wing-light" d="M60 34h10v22H60z" />
      </g>
      <path className="allay-body-shadow" d="M31 48h26v31h-7v9H38v-9h-7z" />
      <path className="allay-body" d="M35 47h18v30h-5v8h-8v-8h-5z" />
      <path className="allay-head-shadow" d="M24 12h40v37H24z" />
      <path className="allay-head" d="M28 9h35v36H28z" />
      <path className="allay-face" d="M31 24h29v17H31z" />
      <path className="allay-eye" d="M34 27h8v8h-8zm16 0h8v8h-8z" />
      <path className="allay-eye-shine" d="M35 28h3v3h-3zm16 0h3v3h-3z" />
      <path className="allay-mouth" d="M43 37h7v2h-7z" />
      <path className="allay-arm" d="M27 52h8v22h-8zm26 0h8v22h-8z" />
    </svg>
  );
}
