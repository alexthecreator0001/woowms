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

    const pinData = markers.map((m) => {
      const pin = map.getPin({ lat: m.lat, lng: m.lng });
      return { ...m, x: pin.x, y: pin.y };
    });

    const svg = map.getSVG({
      radius: 0.22,
      color: "#94a3b860",
      shape: "circle",
      backgroundColor: "transparent",
    });

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
          // Small base dot, grows logarithmically with order count
          const logScale = Math.log2((pin.value || 1) + 1) / Math.log2(maxVal + 1);
          const r = 0.3 + logScale * 0.7;
          return (
            <g key={`marker-${i}`}>
              {/* Pulsing ring */}
              <circle cx={pin.x} cy={pin.y} r={r} fill={markerColor} opacity="0.15">
                <animate attributeName="r" from={String(r)} to={String(r + 1.5)} dur="2.5s" begin={`${(i * 0.4) % 2.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.25" to="0" dur="2.5s" begin={`${(i * 0.4) % 2.5}s`} repeatCount="indefinite" />
              </circle>
              {/* Solid dot */}
              <circle cx={pin.x} cy={pin.y} r={r} fill={markerColor} opacity="0.55" />
              {/* Bright center */}
              <circle cx={pin.x} cy={pin.y} r={Math.max(r * 0.5, 0.15)} fill={markerColor} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
