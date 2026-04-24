export type BatteryOrientation = 'vertical' | 'horizontal';

export interface ChargeVizOptions {
  // Colours
  lowColour: string;
  midColour: string;
  highColour: string;

  // Thresholds
  lowThreshold: number;
  highThreshold: number;

  // Appearance
  gradientFill: boolean;
  orientation: BatteryOrientation;
  chargingAnimation: boolean;
  borderWidth: number;

  // Data display
  decimalPlaces: number;
  useRegressionForRate: boolean;

  // Visibility toggles
  showPercentage: boolean;
  showRate: boolean;
  showLowHigh: boolean;
  showStatus: boolean;
}
