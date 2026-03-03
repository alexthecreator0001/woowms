import { useState, useMemo } from "react";
import DottedMap from "dotted-map";

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  value?: number;
  extra?: string;
}

interface MapProps {
  markers?: MapMarker[];
  markerColor?: string;
}

export function WorldMap({ markers = [], markerColor = "#6366f1" }: MapProps) {
  const [hover, setHover] = useState<{ idx: number; screenX: number; screenY: number } | null>(null);

  const { svgMap, pinData, viewBox } = useMemo(() => {
    const map = new DottedMap({ height: 100, grid: "diagonal" });

    const pinData = markers.map((m) => {
      const pin = map.getPin({ lat: m.lat, lng: m.lng });
      return { ...m, x: pin.x, y: pin.y };
    });

    const svg = map.getSVG({
      radius: 0.22,
      color: "#9ca3afA0",
      shape: "circle",
      backgroundColor: "transparent",
    });

    const vbMatch = svg.match(/viewBox="([^"]+)"/);
    const viewBox = vbMatch ? vbMatch[1] : "0 0 200 100";

    return { svgMap: svg, pinData, viewBox };
  }, [markers]);

  const maxVal = Math.max(...markers.map((m) => m.value || 1), 1);
  const hoveredPin = hover !== null ? pinData[hover.idx] : null;

  return (
    <div className="w-full aspect-[2/1] rounded-lg relative font-sans">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full pointer-events-none select-none"
        alt="world map"
        draggable={false}
      />
      <svg
        viewBox={viewBox}
        className="w-full h-full absolute inset-0 select-none"
        onMouseLeave={() => setHover(null)}
      >
        {pinData.map((pin, i) => {
          const logScale = Math.log2((pin.value || 1) + 1) / Math.log2(maxVal + 1);
          const r = 0.3 + logScale * 0.7;
          const isHovered = hover?.idx === i;
          return (
            <g key={`marker-${i}`}>
              {/* Pulsing ring */}
              <circle cx={pin.x} cy={pin.y} r={r} fill={markerColor} opacity="0.15">
                <animate attributeName="r" from={String(r)} to={String(r + 1.5)} dur="2.5s" begin={`${(i * 0.4) % 2.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.25" to="0" dur="2.5s" begin={`${(i * 0.4) % 2.5}s`} repeatCount="indefinite" />
              </circle>
              {/* Solid dot */}
              <circle cx={pin.x} cy={pin.y} r={isHovered ? r + 0.3 : r} fill={markerColor} opacity={isHovered ? "0.9" : "0.55"} className="transition-all duration-150" />
              {/* Bright center */}
              <circle cx={pin.x} cy={pin.y} r={Math.max(r * 0.5, 0.15)} fill={markerColor} />
              {/* Hover hit area (bigger invisible circle) */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={Math.max(r + 1.5, 2)}
                fill="transparent"
                className="cursor-pointer"
                style={{ pointerEvents: "all" }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGCircleElement).closest("div")!.getBoundingClientRect();
                  const svg = (e.target as SVGCircleElement).closest("svg")!;
                  const svgRect = svg.getBoundingClientRect();
                  const scaleX = svgRect.width / parseFloat(viewBox.split(" ")[2]);
                  const scaleY = svgRect.height / parseFloat(viewBox.split(" ")[3]);
                  setHover({
                    idx: i,
                    screenX: pin.x * scaleX + svgRect.left - rect.left,
                    screenY: pin.y * scaleY + svgRect.top - rect.top,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      {hoveredPin && hover && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: hover.screenX, top: hover.screenY, transform: "translate(-50%, -100%) translateY(-10px)" }}
        >
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-xs whitespace-nowrap">
            <p className="font-semibold text-foreground">{hoveredPin.label}</p>
            <p className="text-muted-foreground">
              {hoveredPin.value} {hoveredPin.value === 1 ? "order" : "orders"}
              {hoveredPin.extra ? ` · ${hoveredPin.extra}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
