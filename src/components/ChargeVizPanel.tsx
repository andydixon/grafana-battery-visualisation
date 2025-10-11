// ---------------------------------------------------------------------------
// ChargeVizPanel.tsx
// ---------------------------------------------------------------------------

import React from 'react';
import { PanelProps } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

interface ChargeVizOptions {
  lowColour: string;
  midColour: string;
  highColour: string;
  gradientFill: boolean;
  decimalPlaces: number;
  useRegressionForRate: boolean;
  hideText: boolean;
}

interface Props extends PanelProps<ChargeVizOptions> {}

// Utility: safely convert any value to a finite number.
const toFinite = (v: any): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Compute least-squares slope (% per minute) for stable trend estimation.
function slopePercentPerMinute(times: number[], values: number[]): number {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < times.length; i++) {
    const t = toFinite(times[i]);
    const v = toFinite(values[i]);
    if (t !== undefined && v !== undefined) pts.push([t, v]);
  }
  if (pts.length < 2) return 0;

  const xs = pts.map(p => (p[0] - pts[0][0]) / 60000);
  const ys = pts.map(p => p[1]);
  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;

  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    num += dx * dy;
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

export const ChargeVizPanel: React.FC<Props> = ({ data, width, height, options }) => {
  const theme = useTheme2();

  const lowColour = options.lowColour || '#F44336';
  const midColour = options.midColour || '#FF9800';
  const highColour = options.highColour || '#4CAF50';
  const gradientFill = options.gradientFill ?? true;
  const dp = Number.isFinite(options.decimalPlaces) ? options.decimalPlaces : 2;
  const useRegression = options.useRegressionForRate ?? false;
  const hideText = options.hideText ?? false;

  // -----------------------------------------------------------------------
  // Data extraction and basic stats
  // -----------------------------------------------------------------------
  let currentValue = 0;
  let rate = 0;
  let low = 0;
  let high = 0;

  if (data.series.length > 0) {
    const series = data.series[0];
    const valueField = series.fields.find(f => f.type === 'number');
    const timeField = series.fields.find(f => f.type === 'time');

    if (valueField && timeField) {
      const rawValues = valueField.values.toArray();
      const rawTimes = timeField.values.toArray();
      const values: number[] = [];
      const times: number[] = [];

      for (let i = 0; i < rawValues.length; i++) {
        const v = toFinite(rawValues[i]);
        const t = toFinite(rawTimes[i]);
        if (v !== undefined && t !== undefined) {
          values.push(v);
          times.push(t);
        }
      }

      if (values.length > 0) {
        currentValue = values[values.length - 1];
        low = Math.min(...values);
        high = Math.max(...values);

        if (useRegression && values.length >= 2) {
          rate = slopePercentPerMinute(times, values);
        } else if (values.length >= 2) {
          const deltaPercent = values[values.length - 1] - values[0];
          const deltaMinutes = (times[times.length - 1] - times[0]) / 60000;
          rate = deltaMinutes !== 0 ? deltaPercent / deltaMinutes : 0;
        }
      }
    }
  }

  // Clamp the percentage range.
  const fillLevel = Math.max(0, Math.min(100, currentValue));

  // Select colour by thresholds.
  let fillColour = highColour;
  if (fillLevel < 30) fillColour = lowColour;
  else if (fillLevel < 70) fillColour = midColour;

  // -----------------------------------------------------------------------
  // Gradient setup for charge/discharge effect
  // -----------------------------------------------------------------------
  const gradientId = 'batteryGradient';
  let gradientDef: React.ReactNode = null;
  if (gradientFill) {
    let startColour = fillColour;
    let endColour = fillColour;
    if (rate > 0) {
      startColour = fillColour;
      endColour = theme.colors.success.text;
    } else if (rate < 0) {
      startColour = theme.colors.error.text;
      endColour = fillColour;
    }

    gradientDef = (
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={startColour} />
          <stop offset="100%" stopColor={endColour} />
        </linearGradient>
      </defs>
    );
  }

  // The SVG’s internal fill height (for the battery graphic)
  const fillHeightPx = (fillLevel / 100) * 220;

  // -----------------------------------------------------------------------
  // Render layout
  // -----------------------------------------------------------------------
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
        width: '100%',
        fontFamily: 'Inter, sans-serif',
        color: theme.colors.text.primary,
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Independent battery element */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <svg
          style={{
            height: '100%',   // fill available panel height
            width: 'auto',    // preserve natural aspect ratio – crucial fix
          }}
          viewBox="0 0 110 240"
          preserveAspectRatio="xMidYMid meet"
        >
          {gradientDef}

          {/* Battery outline */}
          <rect
            x="2"
            y="10"
            width="106"
            height="220"
            rx="6"
            ry="6"
            stroke={theme.colors.text.secondary}
            strokeWidth="3"
            fill="none"
          />

          {/* Terminal */}
          <rect
            x="45"
            y="0"
            width="20"
            height="8"
            rx="2"
            ry="2"
            fill={theme.colors.text.secondary}
          />

          {/* Fill area */}
          <rect
            x="5"
            y={230 - fillHeightPx}
            width="100"
            height={fillHeightPx}
            fill={gradientFill ? `url(#${gradientId})` : fillColour}
          />

          {/* Percentage text inside the battery */}
          <text
            x="55"
            y="120"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="28"
            fontWeight="bold"
          >
            {fillLevel.toFixed(0)}%
          </text>
        </svg>
      </div>

      {/* Optional side text – vertically centred next to battery */}
      {!hideText && (
        <div
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            marginLeft: '10px',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            lineHeight: '1.5em',
          }}
        >
          <div style={{ fontSize: '1.1em', fontWeight: 600 }}>
            Rate: {rate.toFixed(dp)} %/min
          </div>
          <div>Low: {low.toFixed(dp)}%</div>
          <div>High: {high.toFixed(dp)}%</div>
          <div style={{ opacity: 0.8 }}>
            {rate > 0 ? 'Charging ↑' : rate < 0 ? 'Discharging ↓' : 'Stable'}
          </div>
        </div>
      )}
    </div>
  );
};
