"use client";

import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const METRES_PER_KM = 1000;

interface LeafletMapInnerProps {
  center: [number, number];
  address: string;
  className?: string;
  radiusKm?: number;
  zoom?: number;
}

// We need to override Leaflet's default marker icons since they expect images in a specific path
const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EA580C" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;

const customIcon = L.divIcon({
  html: iconHtml,
  className: "custom-leaflet-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

export default function LeafletMapInner({
  center,
  className,
  radiusKm = 20,
  zoom = 10,
}: LeafletMapInnerProps) {
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
        {radiusKm > 0 && (
          <Circle
            center={center}
            radius={radiusKm * METRES_PER_KM}
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
