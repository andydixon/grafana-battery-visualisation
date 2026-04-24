import React, { useId, useMemo } from 'react';
import { PanelProps } from '@grafana/data';
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

// ---------------------------------------------------------------------------
// Sub-components (SVG batteries)
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
  orientation: 'vertical' | 'horizontal';
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

      {/* Terminal nub */}
      <rect x="38" y="2" width="34" height="12" rx="4" ry="4" fill={strokeColour} />

      {/* Body outline */}
      <rect
        x={bodyX} y={bodyY} width={bodyW} height={bodyH}
        rx={r} ry={r}
        stroke={strokeColour} strokeWidth={borderWidth} fill="none"
      />

      {/* Fill — clipped to body shape */}
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

      {/* Terminal nub (right side) */}
      <rect x={bodyX + bodyW + 2} y="33" width="12" height="34" rx="4" ry="4" fill={strokeColour} />

      {/* Body outline */}
      <rect
        x={bodyX} y={bodyY} width={bodyW} height={bodyH}
        rx={r} ry={r}
        stroke={strokeColour} strokeWidth={borderWidth} fill="none"
      />

      {/* Fill */}
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

  const showAnyStats = showRate || showLowHigh || showStatus;

  // -----------------------------------------------------------------------
  // Data extraction
  // -----------------------------------------------------------------------
  const { currentValue, rate, low, high } = useMemo(() => {
    let cur = 0;
    let r = 0;
    let lo = 0;
    let hi = 0;

    if (data.series.length > 0) {
      const series = data.series[0];
      const valueField = series.fields.find((f) => f.type === 'number');
      const timeField = series.fields.find((f) => f.type === 'time');

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
    }

    return { currentValue: cur, rate: r, low: lo, high: hi };
  }, [data.series, useRegression]);

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
  if (gradientFill) {
    if (rate > 0) {
      endColour = theme.colors.success.text;
    } else if (rate < 0) {
      startColour = theme.colors.error.text;
    }
  }

  const isCharging = rate > 0;
  const isDischarging = rate < 0;
  const animating = chargingAnimation && isCharging;

  // -----------------------------------------------------------------------
  // Responsive layout decisions
  // -----------------------------------------------------------------------
  const isCompact = orientation === 'vertical' ? width < 140 : height < 100;
  const isTiny = width < 80 || height < 80;

  // Stats go beside the battery or below/beside it depending on space
  const useColumnLayout = orientation === 'vertical'
    ? width < 220
    : height < 180;

  // Scale stat font size to available space
  const statAreaSize = useColumnLayout
    ? (orientation === 'vertical' ? height * 0.3 : width * 0.3)
    : (orientation === 'vertical' ? width * 0.5 : height * 0.5);
  const baseFontSize = Math.max(10, Math.min(16, statAreaSize / 8));

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
    flex: ${showAnyStats && !isTiny ? '1 1 auto' : '1 1 100%'};
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    ${useColumnLayout ? 'width: 100%;' : 'height: 100%;'}
    overflow: hidden;
  `;

  const statsStyle = css`
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: ${useColumnLayout ? 'center' : 'flex-start'};
    justify-content: center;
    gap: 2px;
    font-size: ${baseFontSize}px;
    line-height: 1.4;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
  `;

  const statusStyle = css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
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

  // Determine readable text colour for the percentage overlay
  const textColour = fillLevel > 45 && fillLevel < 85
    ? '#ffffff'
    : fillLevel <= 45
      ? theme.colors.text.primary
      : '#ffffff';

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
    orientation,
    animating,
    textColour,
  };

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

      {showAnyStats && !isTiny && (
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
          {showStatus && !isCompact && (
            <div className={statusStyle}>
              {isCharging ? '⚡ Charging' : isDischarging ? '↓ Discharging' : '— Stable'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
