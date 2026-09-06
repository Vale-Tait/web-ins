"use client";

type ProductLoadingProps = {
  label?: string;
  detail?: string;
  chrome?: boolean;
  canvas?: boolean;
};

export function ProductLoadingFrame({
  label = "Loading",
  canvas = false
}: ProductLoadingProps) {
  return (
    <div className={`app-scale-root product-loading-frame ${canvas ? "product-loading-frame-canvas" : ""}`}>
      <div className="product-loading-main">
        <LoadingLabel label={label} />
      </div>
    </div>
  );
}

export function ProductLoadingInline({
  label = "Loading"
}: Pick<ProductLoadingProps, "label" | "detail">) {
  return <div className="product-loading-inline"><LoadingLabel label={label} /></div>;
}

function LoadingLabel({ label }: { label: string }) {
  return (
    <p className="mono product-loading-label" role="status" aria-busy="true" aria-label={`${label}...`}>
      <span aria-hidden="true">{label}<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></span>
    </p>
  );
}
