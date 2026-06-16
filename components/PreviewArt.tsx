export function PreviewArt({ domain, dark = false }: { domain: string; dark?: boolean }) {
  if (domain.includes("makemepulse")) {
    return (
      <div className="relative h-full overflow-hidden rounded bg-[#111] text-white">
        <div className="absolute left-7 top-7 text-xs text-[#8aa0b7]">makemepulse.</div>
        <div className="absolute left-[27%] top-[28%] text-5xl font-light">global</div>
        <div className="absolute left-[38%] top-[44%] text-5xl font-light">creative</div>
        <div className="absolute bottom-0 left-[22%] h-[35%] w-[70%] bg-gradient-to-b from-[#a9ada2] to-[#8a806e]" />
        <div className="absolute bottom-3 right-[-24px] text-6xl font-semibold">studio.</div>
      </div>
    );
  }

  if (domain.includes("isa")) {
    return (
      <div className="relative h-full overflow-hidden rounded bg-white text-black">
        <div className="absolute left-8 top-8 text-4xl font-black">ISA DE BURGH</div>
        <div className="absolute left-8 top-[42%] text-xl leading-[1.05]">Brand Architecture<br />Creative Content<br />Storytelling<br />Art Direction</div>
        <div className="absolute bottom-0 right-0 h-[68%] w-[44%] bg-[radial-gradient(circle,#bbb,#eee_58%,#f7f7f7)]" />
      </div>
    );
  }

  return (
    <div className={`relative grid h-full place-items-center overflow-hidden rounded ${dark ? "bg-[#111] text-white" : "bg-[#f4f4f4] text-[#9ca3af]"}`}>
      <span className="mono text-xs uppercase tracking-[0.2em]">Loading preview...</span>
    </div>
  );
}
