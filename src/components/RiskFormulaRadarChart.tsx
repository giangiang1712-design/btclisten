import React from 'react';

interface RiskFormulaRadarChartProps {
  severityS: number; // 0 to 50
  divergenceD: number; // 0 to 20
  velocityV: number; // 0.0 to 1.0
  impactI: number; // 0.0 to 1.0
  riskScore: number; // 0 to 100
  isDark?: boolean;
}

export const RiskFormulaRadarChart: React.FC<RiskFormulaRadarChartProps> = ({
  severityS = 20,
  divergenceD = 0,
  velocityV = 0.3,
  impactI = 0.5,
  riskScore = 30,
  isDark = false,
}) => {
  // Convert 4 metrics into 0-100% normalized scales
  const normS = Math.min(100, Math.max(0, (severityS / 50) * 100));
  const normD = Math.min(100, Math.max(0, (divergenceD / 20) * 100));
  const normV = Math.min(100, Math.max(0, velocityV * 100));
  const normI = Math.min(100, Math.max(0, impactI * 100));

  // Center & Radius for SVG
  const size = 200;
  const center = size / 2;
  const radius = 65;

  // 4 Axes Angles: Top (S), Right (D), Bottom (V), Left (I)
  // Angles in radians: -PI/2 (Top), 0 (Right), PI/2 (Bottom), PI (Left)
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const getCoordinates = (valuePercent: number, angle: number) => {
    const r = (valuePercent / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const values = [normS, normD, normV, normI];
  const points = values.map((val, idx) => getCoordinates(val, angles[idx]));
  const polygonPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Outer grid polygons (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Dynamic Fill & Stroke colors for pure high contrast monochrome
  const strokeColor = '#ffffff';
  const fillColor = 'rgba(255, 255, 255, 0.25)';

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-zinc-700 bg-black text-white">
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1 flex items-center gap-1.5">
        <span>Biểu Đồ Radar Chỉ Số (S, D, V, I)</span>
      </div>

      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Concentric Radar Grids */}
          {gridLevels.map((lvl, i) => {
            const gridPts = angles.map((ang) => getCoordinates(lvl * 100, ang));
            const gridStr = gridPts.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polygon
                key={i}
                points={gridStr}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
                strokeDasharray={i === gridLevels.length - 1 ? 'none' : '2,2'}
              />
            );
          })}

          {/* Cross Axes Lines */}
          {angles.map((ang, i) => {
            const p = getCoordinates(100, ang);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled Metric Polygon */}
          <polygon
            points={polygonPointsStr}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            className="transition-all duration-500"
          />

          {/* Vertex Circles */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="1"
              className="transition-all duration-300"
            />
          ))}

          {/* Axis Labels */}
          {/* Top Label (S) */}
          <text x={center} y={center - radius - 10} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
            S ({normS.toFixed(0)}%)
          </text>
          {/* Right Label (D) */}
          <text x={center + radius + 12} y={center + 4} textAnchor="start" fill="#ffffff" fontSize="10" fontWeight="bold">
            D ({normD.toFixed(0)}%)
          </text>
          {/* Bottom Label (V) */}
          <text x={center} y={center + radius + 16} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
            V ({normV.toFixed(0)}%)
          </text>
          {/* Left Label (I) */}
          <text x={center - radius - 12} y={center + 4} textAnchor="end" fill="#ffffff" fontSize="10" fontWeight="bold">
            I ({normI.toFixed(0)}%)
          </text>
        </svg>

        {/* Center Score Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-black px-2.5 py-1 rounded-lg border-2 border-white shadow-lg">
            <div className="text-[9px] font-mono uppercase text-zinc-400">Risk Score</div>
            <div className="text-xs font-black font-mono text-white">
              {riskScore.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Table */}
      <div className="mt-2 w-full grid grid-cols-2 gap-1.5 text-[10.5px] font-mono border-t border-zinc-800 pt-2 text-white">
        <div className="flex items-center justify-between px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          <span className="text-zinc-300 font-bold">Severity (S):</span>
          <span className="font-bold text-white">{severityS}/50</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          <span className="text-zinc-300 font-bold">Divergence (D):</span>
          <span className="font-bold text-white">{divergenceD}/20</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          <span className="text-zinc-300 font-bold">Velocity (V):</span>
          <span className="font-bold text-white">{velocityV}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          <span className="text-zinc-300 font-bold">Impact (I):</span>
          <span className="font-bold text-white">{impactI}</span>
        </div>
      </div>
    </div>
  );
};
