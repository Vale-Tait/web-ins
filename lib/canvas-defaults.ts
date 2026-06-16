import type { CanvasViewport, DeviceView } from "@/lib/types";

export const defaultCanvasViewport: CanvasViewport = {
  pan: { x: 220, y: 120 },
  zoom: 0.5,
  size: { width: 1200, height: 800 }
};

export const canvasMinZoom = 0.25;
export const canvasMaxZoom = 1;
export const canvasZoomStep = 1.08;

export const canvasDeviceSizes: Record<DeviceView, { width: number; height: number }> = {
  desktop: { width: 1742, height: 1088 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 }
};

export const defaultWebsiteFrameScale = 1;
