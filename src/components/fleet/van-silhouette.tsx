import type { VanGeometry } from "@/lib/fleet-geometry";

/**
 * One van, drawn as a parametric SVG side profile.
 *
 * Every coordinate derives from `VanGeometry`, which derives from the real
 * `length_mm` / `height_mm` / `wheelbase_mm` at the fleet's shared scale. There
 * are no hardcoded shapes: change a dimension in the database and the drawing
 * changes correctly (MOTION.md §8 — "automatically correct when the client
 * confirms real measurements").
 *
 * Parts are separate elements so the Fleet Line can animate them independently:
 * wheels rotate, the body settles, headlights bloom on hover.
 */
export function VanSilhouette({
  geo,
  isHiAce,
  wheelRotationDeg = 0,
  frontWheelId,
  rearWheelId,
}: {
  geo: VanGeometry;
  /** HiAce vans have a shorter bonnet and a more raked screen than a Sprinter. */
  isHiAce: boolean;
  wheelRotationDeg?: number;
  frontWheelId?: string;
  rearWheelId?: string;
}) {
  const w = geo.bodyWidthPx;
  const h = geo.bodyHeightPx;
  const r = geo.wheelRadiusPx;

  // Ground sits at y = h. The body floats a little above it on its suspension.
  const rideHeight = r * 0.55;
  const bodyBottom = h - rideHeight;

  const noseLen = geo.cabWidthPx * (isHiAce ? 0.28 : 0.42);
  const screenLean = geo.cabWidthPx * (isHiAce ? 0.42 : 0.3);
  const roofY = 0;
  const beltlineY = bodyBottom * 0.42;

  // Body outline: nose → raked screen → roof → tail → back down to the sill.
  const body = [
    `M 0 ${bodyBottom}`,
    `L 0 ${beltlineY + (bodyBottom - beltlineY) * 0.35}`,
    `Q 0 ${beltlineY * 0.72} ${noseLen * 0.55} ${beltlineY * 0.66}`,
    `L ${noseLen} ${beltlineY * 0.62}`,
    `L ${noseLen + screenLean} ${roofY + h * 0.03}`,
    `Q ${noseLen + screenLean + w * 0.01} ${roofY} ${noseLen + screenLean + w * 0.04} ${roofY}`,
    `L ${w - w * 0.012} ${roofY}`,
    `Q ${w} ${roofY} ${w} ${roofY + h * 0.04}`,
    `L ${w} ${bodyBottom}`,
    `Z`,
  ].join(" ");

  // Cab side glass.
  const glass = [
    `M ${noseLen + screenLean * 0.34} ${beltlineY * 0.86}`,
    `L ${noseLen + screenLean * 0.96} ${roofY + h * 0.1}`,
    `L ${noseLen + screenLean + geo.cabWidthPx * 0.52} ${roofY + h * 0.1}`,
    `L ${noseLen + screenLean + geo.cabWidthPx * 0.52} ${beltlineY * 0.86}`,
    `Z`,
  ].join(" ");

  const cargoDoorX = noseLen + screenLean + geo.cabWidthPx * 0.72;

  return (
    <g className="van-silhouette">
      {/* Body */}
      <path d={body} className="van-body" />

      {/* Cargo bay division — the bulkhead, which every van in the fleet has. */}
      <line x1={cargoDoorX} y1={beltlineY * 0.5} x2={cargoDoorX} y2={bodyBottom} className="van-line" />
      {/* Rear door split */}
      <line x1={w * 0.985} y1={roofY + h * 0.08} x2={w * 0.985} y2={bodyBottom} className="van-line" />

      {/* Glass */}
      <path d={glass} className="van-glass" />

      {/* Headlight — hidden until hover, where it blooms (§4.1). */}
      <ellipse
        cx={noseLen * 0.34}
        cy={beltlineY * 0.92}
        rx={Math.max(2, w * 0.012)}
        ry={Math.max(1.4, h * 0.018)}
        className="van-headlight"
      />

      {/* Number plate — goes full plate-yellow on hover. */}
      <rect
        x={noseLen * 0.1}
        y={bodyBottom - (bodyBottom - beltlineY) * 0.3}
        width={Math.max(6, w * 0.032)}
        height={Math.max(3, h * 0.05)}
        rx={1}
        className="van-plate"
      />

      {/* Wheels. Rotation is real: distance travelled over circumference. */}
      {[
        { cx: geo.frontAxleXPx, id: frontWheelId },
        { cx: geo.rearAxleXPx, id: rearWheelId },
      ].map((wheel, i) => (
        <g
          key={i}
          id={wheel.id}
          transform={`translate(${wheel.cx} ${h - r}) rotate(${wheelRotationDeg})`}
          className="van-wheel"
        >
          <circle r={r} className="van-tyre" />
          <circle r={r * 0.52} className="van-rim" />
          {/* Spokes make the rotation legible; without them a circle spinning
              is indistinguishable from a circle standing still. */}
          {[0, 60, 120].map((a) => (
            <line
              key={a}
              x1={-r * 0.5 * Math.cos((a * Math.PI) / 180)}
              y1={-r * 0.5 * Math.sin((a * Math.PI) / 180)}
              x2={r * 0.5 * Math.cos((a * Math.PI) / 180)}
              y2={r * 0.5 * Math.sin((a * Math.PI) / 180)}
              className="van-spoke"
            />
          ))}
        </g>
      ))}
    </g>
  );
}
