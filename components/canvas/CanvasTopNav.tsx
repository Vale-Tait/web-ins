"use client";

import { ProductTopNav } from "@/components/ProductTopNav";

export function CanvasTopNav({ dialogsEnabled = false }: { dialogsEnabled?: boolean }) {
  void dialogsEnabled;
  return <ProductTopNav />;
}
