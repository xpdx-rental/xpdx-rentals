"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * The service-area map. Loaded only via `DynamicServiceMap`, which code-splits
 * it and gates it on the viewport — never import this module directly.
 *
 * ── Tiles ───────────────────────────────────────────────────────────────────
 * CARTO's dark basemap rather than raw `tile.openstreetmap.org`. Two reasons:
 *   • OpenStreetMap's tile usage policy explicitly excludes heavy or
 *     commercial use of their donated tile servers, and this map sits in the
 *     footer of every page of a commercial site. They enforce it by Referer,
 *     so the failure mode is a blank map in production.
 *   • The site renders dark (`<html class="dark">`); the standard OSM raster
 *     is a bright cream sheet in the middle of it.
 * `*.basemaps.cartocdn.com` is already allowlisted in the CSP `img-src`.
 */

interface ServiceMapProps {
  center: [number, number];
  address: string;
  className?: string;
  /** Radius of the highlighted service area. */
  radiusMiles?: number;
  zoom?: number;
}

const METRES_PER_MILE = 1609.34;

export default function ServiceMap({
  center,
  address,
  className,
  radiusMiles = 20,
  zoom = 10,
}: ServiceMapProps) {
  // `useMemo` rather than `useState` + `useEffect`: this module only ever runs
  // in the browser (its only caller loads it with `ssr: false`), so there is no
  // window-availability problem to work around, and the previous
  // mount-then-set-state dance cost an extra render and a second paint of the
  // whole map for no benefit.
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "bg-transparent",
        html: `<div style="background-color:#EA580C;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    [],
  );

  return (
    <div
      className={
        className ?? "w-full h-[500px] rounded-2xl overflow-hidden border border-border z-10 relative"
      }
    >
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="size-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <Circle
          center={center}
          radius={radiusMiles * METRES_PER_MILE}
          pathOptions={{ color: "#EA580C", fillColor: "#EA580C", fillOpacity: 0.1, weight: 2 }}
        />

        <Marker position={center} icon={icon}>
          <Popup>
            <div className="mb-1 text-sm font-bold">XPDX Rentals</div>
            <div className="text-xs">{address}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
