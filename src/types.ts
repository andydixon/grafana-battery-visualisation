export type BatteryOrientation = 'vertical' | 'horizontal';

export interface ChargeVizOptions {
  // Field selectors
  chargeField: string;
  enableLoad: boolean;
  loadField: string;
  enableStateField: boolean;
  stateField: string;
  stateChargingValue: string;
  stateDischargingValue: string;

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
