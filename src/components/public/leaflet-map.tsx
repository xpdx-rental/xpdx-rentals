"use client";

import dynamic from "next/dynamic";

const LeafletMapInner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-border flex items-center justify-center bg-muted">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  ),
});

interface LeafletMapProps {
  center: [number, number];
  address: string;
  className?: string;
  radiusKm?: number;
  zoom?: number;
}

export function LeafletMap(props: LeafletMapProps) {
  return <LeafletMapInner {...props} />;
}
