import React, { useId, useMemo } from 'react';
import { PanelProps, Field } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { css, keyframes } from '@emotion/css';
import { ChargeVizOptions } from '../types';

interface Props extends PanelProps<ChargeVizOptions> {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toFinite = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function slopePercentPerMinute(times: number[], values: number[]): number {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < times.length; i++) {
    const t = toFinite(times[i]);
    const v = toFinite(values[i]);
    if (t !== undefined && v !== undefined) {
      pts.push([t, v]);
    }
  }
  if (pts.length < 2) {
    return 0;
  }

  const xs = pts.map((p) => (p[0] - pts[0][0]) / 60000);
  const ys = pts.map((p) => p[1]);
  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;

  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** Find a field by configured name, falling back to first field of given type. */
function resolveField(
  fields: Field[],
  configuredName: string | undefined,
  fallbackType: string
): Field | undefined {
  if (configuredName) {
    const match = fields.find((f) => f.name === configuredName);
    if (match) {
      return match;
    }
  }
  return fields.find((f) => f.type === fallbackType);
}

// ---------------------------------------------------------------------------
// SVG sub-components
// ---------------------------------------------------------------------------

interface BatteryGfxProps {
  fillLevel: number;
  fillColour: string;
  gradientFill: boolean;
  gradientId: string;
  clipId: string;
  startColour: string;
  endColour: string;
  strokeColour: string;
  borderWidth: number;
  showPercentage: boolean;
  animating: boolean;
  textColour: string;
}

const pulseKf = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

function VerticalBattery(props: BatteryGfxProps) {
  const {
    fillLevel, fillColour, gradientFill, gradientId, clipId,
    startColour, endColour, strokeColour, borderWidth, showPercentage,
    animating, textColour,
  } = props;

  const bodyX = 5;
  const bodyY = 14;
  const bodyW = 100;
  const bodyH = 220;
  const r = 8;
  const fillH = (fillLevel / 100) * bodyH;

  return (
    <svg viewBox="0 0 110 244" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {gradientFill && (
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={startColour} />
            <stop offset="100%" stopColor={endColour} />
          </linearGradient>
        )}
        <clipPath id={clipId}>
          <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={r} ry={r} />
        </clipPath>
      </defs>

      <rect x="38" y="2" width="34" height="12" rx="4" ry="4" fill={strokeColour} />

      <rect
        x={bodyX} y={bodyY} width={bodyW} height={bodyH}
        rx={r} ry={r}
        stroke={strokeColour} strokeWidth={borderWidth} fill="none"
      />

      <rect
        x={bodyX}
        y={bodyY + bodyH - fillH}
        width={bodyW}
        height={fillH}
        fill={gradientFill ? `url(#${gradientId})` : fillColour}
        clipPath={`url(#${clipId})`}
        className={animating ? css`animation: ${pulseKf} 2s ease-in-out infinite;` : undefined}
      />

      {showPercentage && (
        <text
          x={bodyX + bodyW / 2}
          y={bodyY + bodyH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColour}
          fontSize="28"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {fillLevel.toFixed(0)}%
        </text>
      )}
    </svg>
  );
}

function HorizontalBattery(props: BatteryGfxProps) {
  const {
    fillLevel, fillColour, gradientFill, gradientId, clipId,
    startColour, endColour, strokeColour, borderWidth, showPercentage,
    animating, textColour,
  } = props;

  const bodyX = 5;
  const bodyY = 5;
  const bodyW = 220;
  const bodyH = 100;
  const r = 8;
  const fillW = (fillLevel / 100) * bodyW;

  return (
    <svg viewBox="0 0 248 110" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {gradientFill && (
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={startColour} />
            <stop offset="100%" stopColor={endColour} />
          </linearGradient>
        )}
        <clipPath id={clipId}>
          <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={r} ry={r} />
        </clipPath>
      </defs>

      <rect x={bodyX + bodyW + 2} y="33" width="12" height="34" rx="4" ry="4" fill={strokeColour} />

      <rect
        x={bodyX} y={bodyY} width={bodyW} height={bodyH}
        rx={r} ry={r}
        stroke={strokeColour} strokeWidth={borderWidth} fill="none"
      />

      <rect
        x={bodyX}
        y={bodyY}
        width={fillW}
        height={bodyH}
        fill={gradientFill ? `url(#${gradientId})` : fillColour}
        clipPath={`url(#${clipId})`}
        className={animating ? css`animation: ${pulseKf} 2s ease-in-out infinite;` : undefined}
      />

      {showPercentage && (
        <text
          x={bodyX + bodyW / 2}
          y={bodyY + bodyH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColour}
          fontSize="28"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {fillLevel.toFixed(0)}%
        </text>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Load gauge – a semi-circular arc rendered as SVG
// ---------------------------------------------------------------------------

interface LoadGaugeProps {
  value: number;        // 0–100
  size: number;         // px diameter
  colour: string;
  trackColour: string;
  textColour: string;
}

function LoadGauge({ value, size, colour, trackColour, textColour }: LoadGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 40;
  const cx = 50;
  const cy = 50;
  const startAngle = 135;
  const totalSweep = 270;
  const endAngle = startAngle + (clamped / 100) * totalSweep;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPoint = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  // Track (background arc)
  const trackEnd = startAngle + totalSweep;
  const tStart = arcPoint(startAngle);
  const tEnd = arcPoint(trackEnd);
  const trackLargeArc = totalSweep > 180 ? 1 : 0;
  const trackPath = `M ${tStart.x} ${tStart.y} A ${r} ${r} 0 ${trackLargeArc} 1 ${tEnd.x} ${tEnd.y}`;

  // Value arc
  const vStart = arcPoint(startAngle);
  const vEnd = arcPoint(endAngle);
  const sweep = (clamped / 100) * totalSweep;
  const largeArc = sweep > 180 ? 1 : 0;
  const valuePath = clamped > 0
    ? `M ${vStart.x} ${vStart.y} A ${r} ${r} 0 ${largeArc} 1 ${vEnd.x} ${vEnd.y}`
    : '';

  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path d={trackPath} fill="none" stroke={trackColour} strokeWidth="8" strokeLinecap="round" />
      {valuePath && (
        <path d={valuePath} fill="none" stroke={colour} strokeWidth="8" strokeLinecap="round" />
      )}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColour}
        fontSize="18"
        fontWeight="bold"
      >
        {clamped.toFixed(0)}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColour}
        fontSize="9"
        opacity="0.7"
      >
        LOAD
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export const ChargeVizPanel: React.FC<Props> = ({ data, width, height, options, id }) => {
  const theme = useTheme2();
  const reactId = useId();
  const gradientId = `battGrad-${id}-${reactId}`;
  const clipId = `battClip-${id}-${reactId}`;

  // Options with defaults
  const lowColour = options.lowColour || '#F44336';
  const midColour = options.midColour || '#FF9800';
  const highColour = options.highColour || '#4CAF50';
  const lowThreshold = options.lowThreshold ?? 30;
  const highThreshold = options.highThreshold ?? 70;
  const gradientFill = options.gradientFill ?? true;
  const orientation = options.orientation ?? 'vertical';
  const chargingAnimation = options.chargingAnimation ?? true;
  const borderWidth = options.borderWidth ?? 3;
  const dp = Number.isFinite(options.decimalPlaces) ? options.decimalPlaces : 2;
  const useRegression = options.useRegressionForRate ?? false;
  const showPercentage = options.showPercentage ?? true;
  const showRate = options.showRate ?? true;
  const showLowHigh = options.showLowHigh ?? true;
  const showStatus = options.showStatus ?? true;
  const enableLoad = options.enableLoad ?? false;
  const enableStateField = options.enableStateField ?? false;
  const stateChargingValue = (options.stateChargingValue ?? 'charging').toLowerCase();
  const stateDischargingValue = (options.stateDischargingValue ?? 'discharging').toLowerCase();

  // -----------------------------------------------------------------------
  // Data extraction
  // -----------------------------------------------------------------------
  const extracted = useMemo(() => {
    let cur = 0;
    let r = 0;
    let lo = 0;
    let hi = 0;
    let loadValue: number | undefined;
    let stateFromField: 'charging' | 'discharging' | 'stable' | undefined;

    if (data.series.length > 0) {
      const series = data.series[0];
      const fields = series.fields;
      const timeField = fields.find((f) => f.type === 'time');
      const chargeField = resolveField(fields, options.chargeField, 'number');

      if (chargeField && timeField) {
        const rawValues = Array.from(chargeField.values);
        const rawTimes = Array.from(timeField.values);
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
          cur = values[values.length - 1];
          lo = Math.min(...values);
          hi = Math.max(...values);

          if (values.length >= 2) {
            if (useRegression) {
              r = slopePercentPerMinute(times, values);
            } else {
              const deltaPercent = values[values.length - 1] - values[0];
              const deltaMinutes = (times[times.length - 1] - times[0]) / 60000;
              r = deltaMinutes !== 0 ? deltaPercent / deltaMinutes : 0;
            }
          }
        }
      }

      // Load field
      if (enableLoad && options.loadField) {
        const lf = fields.find((f) => f.name === options.loadField);
        if (lf) {
          const arr = Array.from(lf.values);
          const last = toFinite(arr[arr.length - 1]);
          if (last !== undefined) {
            loadValue = last;
          }
        }
      }

      // State field
      if (enableStateField && options.stateField) {
        const sf = fields.find((f) => f.name === options.stateField);
        if (sf) {
          const arr = Array.from(sf.values);
          const lastRaw = arr[arr.length - 1];
          if (lastRaw !== undefined && lastRaw !== null) {
            const v = String(lastRaw).toLowerCase().trim();
            if (v === stateChargingValue) {
              stateFromField = 'charging';
            } else if (v === stateDischargingValue) {
              stateFromField = 'discharging';
            } else {
              stateFromField = 'stable';
            }
          }
        }
      }
    }

    return { currentValue: cur, rate: r, low: lo, high: hi, loadValue, stateFromField };
  }, [
    data.series, useRegression, enableLoad, enableStateField,
    options.chargeField, options.loadField, options.stateField,
    stateChargingValue, stateDischargingValue,
  ]);

  const { currentValue, rate, low, high, loadValue, stateFromField } = extracted;

  // -----------------------------------------------------------------------
  // Derived visual values
  // -----------------------------------------------------------------------
  const fillLevel = Math.max(0, Math.min(100, currentValue));

  let fillColour = midColour;
  if (fillLevel < lowThreshold) {
    fillColour = lowColour;
  } else if (fillLevel >= highThreshold) {
    fillColour = highColour;
  }

  let startColour = fillColour;
  let endColour = fillColour;

  // Determine charging state: prefer state field, else use computed rate
  const isCharging = stateFromField ? stateFromField === 'charging' : rate > 0;
  const isDischarging = stateFromField ? stateFromField === 'discharging' : rate < 0;

  if (gradientFill) {
    if (isCharging) {
      endColour = theme.colors.success.text;
    } else if (isDischarging) {
      startColour = theme.colors.error.text;
    }
  }

  const animating = chargingAnimation && isCharging;

  const showAnyStats = showRate || showLowHigh || showStatus;
  const hasExtras = (enableLoad && loadValue !== undefined);

  // -----------------------------------------------------------------------
  // Responsive layout
  // -----------------------------------------------------------------------
  const isCompact = orientation === 'vertical' ? width < 140 : height < 100;
  const isTiny = width < 80 || height < 80;

  const useColumnLayout = orientation === 'vertical'
    ? width < 240
    : height < 200;

  const statAreaSize = useColumnLayout
    ? (orientation === 'vertical' ? height * 0.3 : width * 0.3)
    : (orientation === 'vertical' ? width * 0.5 : height * 0.5);
  const baseFontSize = Math.max(10, Math.min(16, statAreaSize / 8));

  // Gauge size scales with available panel space
  const gaugeSize = Math.max(48, Math.min(120, Math.min(width, height) * 0.35));

  // No-data state
  if (data.series.length === 0) {
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          color: ${theme.colors.text.secondary};
          font-size: 14px;
        `}
        data-testid="charge-viz-panel"
      >
        No data
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------
  const containerStyle = css`
    display: flex;
    flex-direction: ${useColumnLayout ? 'column' : 'row'};
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 4px;
    box-sizing: border-box;
    gap: ${useColumnLayout ? '2px' : '8px'};
    overflow: hidden;
    font-family: Inter, Helvetica, Arial, sans-serif;
    color: ${theme.colors.text.primary};
  `;

  const batteryWrapStyle = css`
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    ${useColumnLayout ? 'width: 100%;' : 'height: 100%;'}
    overflow: hidden;
  `;

  const sidePanelStyle = css`
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: ${useColumnLayout ? 'center' : 'flex-start'};
    justify-content: center;
    gap: 6px;
    overflow: hidden;
    max-width: 100%;
  `;

  const statsStyle = css`
    display: flex;
    flex-direction: column;
    align-items: inherit;
    gap: 2px;
    font-size: ${baseFontSize}px;
    line-height: 1.4;
    white-space: nowrap;
    text-overflow: ellipsis;
  `;

  const statusBadgeStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: ${baseFontSize * 0.9}px;
    font-weight: 600;
    background: ${isCharging
      ? theme.colors.success.transparent
      : isDischarging
        ? theme.colors.error.transparent
        : theme.colors.secondary.transparent};
    color: ${isCharging
      ? theme.colors.success.text
      : isDischarging
        ? theme.colors.error.text
        : theme.colors.text.secondary};
  `;

  const loadCardStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    border-radius: 8px;
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
  `;

  const textColour = fillLevel > 45 ? '#ffffff' : theme.colors.text.primary;

  const batteryProps: BatteryGfxProps = {
    fillLevel,
    fillColour,
    gradientFill,
    gradientId,
    clipId,
    startColour,
    endColour,
    strokeColour: theme.colors.text.secondary,
    borderWidth,
    showPercentage: showPercentage && !isTiny,
    animating,
    textColour,
  };

  // Load gauge colour: green if low load, amber if moderate, red if high
  const loadClamped = loadValue !== undefined ? Math.max(0, Math.min(100, loadValue)) : 0;
  const loadColour = loadClamped >= 80
    ? theme.colors.error.text
    : loadClamped >= 50
      ? theme.colors.warning.text
      : theme.colors.success.text;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className={containerStyle} data-testid="charge-viz-panel">
      <div className={batteryWrapStyle}>
        {orientation === 'vertical'
          ? <VerticalBattery {...batteryProps} />
          : <HorizontalBattery {...batteryProps} />
        }
      </div>

      {(showAnyStats || hasExtras) && !isTiny && (
        <div className={sidePanelStyle}>
          {/* Load gauge card */}
          {hasExtras && !isCompact && (
            <div className={loadCardStyle}>
              <LoadGauge
                value={loadClamped}
                size={gaugeSize}
                colour={loadColour}
                trackColour={theme.colors.border.weak}
                textColour={theme.colors.text.primary}
              />
            </div>
          )}

          {/* Compact load fallback when gauge doesn't fit */}
          {hasExtras && isCompact && (
            <div className={css`
              font-size: ${baseFontSize}px;
              white-space: nowrap;
            `}>
              <span style={{ opacity: 0.7, marginRight: 4 }}>Load</span>
              <strong style={{ color: loadColour }}>{loadClamped.toFixed(0)}%</strong>
            </div>
          )}

          {/* Status badge */}
          {showStatus && !isCompact && (
            <div className={statusBadgeStyle}>
              {isCharging ? '⚡ Charging' : isDischarging ? '↓ Discharging' : '— Stable'}
            </div>
          )}

          {/* Stats */}
          {(showRate || showLowHigh) && (
            <div className={statsStyle}>
              {showRate && (
                <div>
                  <span style={{ opacity: 0.7, marginRight: 4 }}>Rate</span>
                  <strong>{rate.toFixed(dp)} %/min</strong>
                </div>
              )}
              {showLowHigh && (
                <>
                  <div>
                    <span style={{ opacity: 0.7, marginRight: 4 }}>Low</span>
                    <strong>{low.toFixed(dp)}%</strong>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7, marginRight: 4 }}>High</span>
                    <strong>{high.toFixed(dp)}%</strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
