"use client";

export function ThinPencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.15 14.7 4.25 11.25 12.85 2.65C13.35 2.15 14.16 2.15 14.66 2.65L15.35 3.34C15.85 3.84 15.85 4.65 15.35 5.15L6.75 13.75 3.15 14.7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.7 3.8 14.2 6.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.3 6.1H15.7" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M8.1 4.1H11.9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M6 6.1 6.7 15.2C6.77 16.05 7.48 16.7 8.33 16.7H11.67C12.52 16.7 13.23 16.05 13.3 15.2L14 6.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function CanvasCreateIcon({ className }: { className?: string } = {}) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M810.666667 170.666667H213.333333a42.666667 42.666667 0 0 0-42.666666 42.666666v597.333334a42.666667 42.666667 0 0 0 42.666666 42.666666h597.333334a42.666667 42.666667 0 0 0 42.666666-42.666666V213.333333a42.666667 42.666667 0 0 0-42.666666-42.666666z m-42.666667 597.333333H256V256h512v512zM170.666667 896h42.666666v128H170.666667v-128zM0 810.666667h128v42.666666H0v-42.666666zM896 810.666667h128v42.666666h-128v-42.666666zM810.666667 896h42.666666v128h-42.666666v-128zM810.666667 0h42.666666v128h-42.666666V0zM896 170.666667h128v42.666666h-128V170.666667zM0 170.666667h128v42.666666H0V170.666667zM170.666667 0h42.666666v128H170.666667V0z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.8 12.8 3.1 3.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 3.5v11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3.5 9h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CloseX() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m4.5 4.5 9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
