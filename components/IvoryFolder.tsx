import { useId, type ReactNode } from "react";

export function IvoryFolder({ className = "", preview }: { className?: string; preview?: ReactNode }) {
  const id = useId().replace(/:/g, "");
  const bodyPath =
    "M42 88 C36 88 32 92 32 100 L32 336 C32 344 38 350 46 350 L536 350 C544 350 550 344 550 336 L536 130 C535 122 530 116 522 116 L232 116 C224 116 219 112 216 105 L205 88 C202 82 197 79 190 79 L48 79 C44 79 42 83 42 88 Z";

  return (
    <div className={`relative aspect-[560/360] ${className}`} role="img" aria-label="Ivory paper folder">
      <svg className="absolute inset-0 z-0 h-full w-full" viewBox="0 0 560 360" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-folderBackFill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F5F2EA" />
            <stop offset="100%" stopColor="#ECE8DE" />
          </linearGradient>
          <filter id={`${id}-folderBackShadow`} x="-8%" y="-8%" width="116%" height="120%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#8A8376" floodOpacity="0.12" />
          </filter>
        </defs>
        <path
          d={bodyPath}
          fill={`url(#${id}-folderBackFill)`}
          filter={`url(#${id}-folderBackShadow)`}
          stroke="#D8D5CC"
          strokeWidth="1"
          opacity="0.96"
          transform="translate(0 -2)"
        />
      </svg>

      <div className="absolute left-[17%] top-[28%] z-10 h-[43%] w-[68%] overflow-hidden rounded-[5px] border border-[#D8D5CC]/75 bg-[#F1EEE6] shadow-[0_9px_22px_rgba(80,74,64,0.1)]">
        {preview ? <div className="h-full w-full opacity-90 saturate-[0.9] contrast-[0.96]">{preview}</div> : null}
      </div>

      <svg className="absolute inset-0 z-20 h-full w-full" viewBox="0 0 560 360" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-folderFrontFill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F5F2EA" stopOpacity="0.76" />
            <stop offset="45%" stopColor="#F1EEE6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ECE8DE" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id={`${id}-folderFrontShade`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#D8D5CC" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#CFCBC0" stopOpacity="0.13" />
          </linearGradient>
          <filter id={`${id}-folderFrontShadow`} x="-8%" y="-8%" width="116%" height="120%">
            <feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#8A8376" floodOpacity="0.1" />
          </filter>
          <filter id={`${id}-folderFrontNoise`} x="0" y="0" width="100%" height="100%">
            <feTurbulence baseFrequency="0.85" numOctaves="2" seed="11" type="fractalNoise" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.035" />
            </feComponentTransfer>
          </filter>
          <clipPath id={`${id}-folderFrontClip`}>
            <path d={bodyPath} />
          </clipPath>
        </defs>
        <path d={bodyPath} fill={`url(#${id}-folderFrontFill)`} filter={`url(#${id}-folderFrontShadow)`} stroke="#D8D5CC" strokeWidth="1" />
        <path d={bodyPath} fill={`url(#${id}-folderFrontShade)`} opacity="0.4" />
        <g clipPath={`url(#${id}-folderFrontClip)`}>
          <rect width="560" height="360" fill="#8B8578" filter={`url(#${id}-folderFrontNoise)`} opacity="0.18" />
          <path d="M34 116 H196 C205 116 211 111 214 103" fill="none" stroke="#D8D5CC" strokeWidth="1" opacity="0.42" />
          <rect x="31" y="218" width="520" height="94" fill={`url(#${id}-folderFrontFill)`} opacity="0.96" />
          <g stroke="#C3BFB2" strokeWidth="1" opacity="0.82">
            <line x1="33" x2="550" y1="315" y2="315" />
            <line x1="33" x2="550" y1="321" y2="321" />
            <line x1="33" x2="550" y1="326" y2="326" />
            <line x1="33" x2="550" y1="331" y2="331" />
            <line x1="33" x2="550" y1="336" y2="336" />
            <line x1="33" x2="550" y1="341" y2="341" />
            <line x1="33" x2="550" y1="346" y2="346" />
          </g>
        </g>
        <path d={bodyPath} fill="none" stroke="#D8D5CC" strokeWidth="1" />
      </svg>
    </div>
  );
}
