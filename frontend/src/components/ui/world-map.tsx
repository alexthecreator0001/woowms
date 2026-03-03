import { useMemo } from "react";
import DottedMap from "dotted-map";

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  value?: number;
}

interface MapProps {
  markers?: MapMarker[];
  markerColor?: string;
}

export function WorldMap({ markers = [], markerColor = "#6366f1" }: MapProps) {
  const { svgMap, pinData, viewBox } = useMemo(() => {
    const map = new DottedMap({ height: 100, grid: "diagonal" });

    // Use DottedMap's own projection for correct pin placement
    const pinData = markers.map((m) => {
      const pin = map.getPin({ lat: m.lat, lng: m.lng });
      return { ...m, x: pin.x, y: pin.y };
    });

    const svg = map.getSVG({
      radius: 0.22,
      color: "#d1d5db50",
      shape: "circle",
      backgroundColor: "transparent",
    });

    // Extract viewBox from the generated SVG so overlay matches exactly
    const vbMatch = svg.match(/viewBox="([^"]+)"/);
    const viewBox = vbMatch ? vbMatch[1] : "0 0 200 100";

    return { svgMap: svg, pinData, viewBox };
  }, [markers]);

  const maxVal = Math.max(...markers.map((m) => m.value || 1), 1);

  return (
    <div className="w-full aspect-[2/1] rounded-lg relative font-sans">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full pointer-events-none select-none"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, white 10%, white 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, white 10%, white 90%, transparent)",
        }}
        alt="world map"
        draggable={false}
      />
      <svg
        viewBox={viewBox}
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        {pinData.map((pin, i) => {
          const ratio = Math.sqrt((pin.value || 1) / maxVal);
          const r = 0.6 + ratio * 0.9;
          return (
            <g key={`marker-${i}`}>
              {/* Pulsing ring */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={r}
                fill={markerColor}
                opacity="0.2"
              >
                <animate
                  attributeName="r"
                  from={String(r)}
                  to={String(r + 2.5)}
                  dur="2s"
                  begin={`${(i * 0.3) % 2}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.3"
                  to="0"
                  dur="2s"
                  begin={`${(i * 0.3) % 2}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Solid dot */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={r}
                fill={markerColor}
                opacity="0.65"
              />
              {/* Bright center */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={Math.max(r * 0.45, 0.3)}
                fill={markerColor}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
