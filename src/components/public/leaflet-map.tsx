"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// React-Leaflet MUST be dynamically imported with SSR disabled because it accesses window directly
import dynamic from "next/dynamic";
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

const METRES_PER_MILE = 1609.34;

interface LeafletMapProps {
  center: [number, number];
  address: string;
  className?: string;
  radiusMiles?: number;
  zoom?: number;
}

export function LeafletMap({
  center,
  className,
  radiusMiles = 20,
  zoom = 10,
}: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={className ?? "w-full h-[500px] rounded-2xl overflow-hidden border border-border flex items-center justify-center bg-muted"}>
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // We need to override Leaflet's default marker icons since they expect images in a specific path
  const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EA580C" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
  
  // Create icon dynamically only on client side
  const L = require("leaflet");
  const customIcon = L.divIcon({
    html: iconHtml,
    className: "custom-leaflet-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  return (
    <div className={className ?? "w-full h-[500px] rounded-2xl overflow-hidden border border-border relative z-0"}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="size-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {radiusMiles > 0 && (
          <Circle
            center={center}
            radius={radiusMiles * METRES_PER_MILE}
            pathOptions={{
              color: "#EA580C",
              fillColor: "#EA580C",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}
        <Marker position={center} icon={customIcon} />
      </MapContainer>
    </div>
  );
}
