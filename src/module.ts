import { PanelPlugin } from '@grafana/data';
import { ChargeVizPanel } from './components/ChargeVizPanel';
import { ChargeVizOptions } from './types';

export const plugin = new PanelPlugin<ChargeVizOptions>(ChargeVizPanel).setPanelOptions(
  (builder) => {
    // -- Colours category --
    builder.addColorPicker({
      path: 'lowColour',
      name: 'Low battery colour',
      defaultValue: '#F44336',
      category: ['Colours'],
      description: 'Colour when charge is below the low threshold.',
    });

    builder.addColorPicker({
      path: 'midColour',
      name: 'Medium battery colour',
      defaultValue: '#FF9800',
      category: ['Colours'],
      description: 'Colour when charge is between the low and high thresholds.',
    });

    builder.addColorPicker({
      path: 'highColour',
      name: 'High battery colour',
      defaultValue: '#4CAF50',
      category: ['Colours'],
      description: 'Colour when charge is above the high threshold.',
    });

    // -- Thresholds category --
    builder.addNumberInput({
      path: 'lowThreshold',
      name: 'Low threshold (%)',
      defaultValue: 30,
      settings: { min: 0, max: 100, integer: true },
      category: ['Thresholds'],
      description: 'Charge level below which the low colour is used.',
    });

    builder.addNumberInput({
      path: 'highThreshold',
      name: 'High threshold (%)',
      defaultValue: 70,
      settings: { min: 0, max: 100, integer: true },
      category: ['Thresholds'],
      description: 'Charge level above which the high colour is used.',
    });

    // -- Appearance category --
    builder.addBooleanSwitch({
      path: 'gradientFill',
      name: 'Gradient fill',
      defaultValue: true,
      category: ['Appearance'],
      description: 'Show a gradient that hints at charging/discharging direction.',
    });

    builder.addSelect({
      path: 'orientation',
      name: 'Orientation',
      defaultValue: 'vertical',
      category: ['Appearance'],
      settings: {
        options: [
          { value: 'vertical', label: 'Vertical' },
          { value: 'horizontal', label: 'Horizontal' },
        ],
      },
      description: 'Battery orientation. Horizontal works well in wide, short panels.',
    });

    builder.addBooleanSwitch({
      path: 'chargingAnimation',
      name: 'Charging animation',
      defaultValue: true,
      category: ['Appearance'],
      description: 'Show a pulse animation when the battery is charging.',
    });

    builder.addNumberInput({
      path: 'borderWidth',
      name: 'Border width',
      defaultValue: 3,
      settings: { min: 1, max: 8, integer: true },
      category: ['Appearance'],
      description: 'Thickness of the battery outline.',
    });

    // -- Display category --
    builder.addBooleanSwitch({
      path: 'showPercentage',
      name: 'Show percentage',
      defaultValue: true,
      category: ['Display'],
      description: 'Show the percentage text inside the battery.',
    });

    builder.addBooleanSwitch({
      path: 'showRate',
      name: 'Show charge rate',
      defaultValue: true,
      category: ['Display'],
      description: 'Show the rate of change (%/min).',
    });

    builder.addBooleanSwitch({
      path: 'showLowHigh',
      name: 'Show low / high',
      defaultValue: true,
      category: ['Display'],
      description: 'Show the minimum and maximum values from the series.',
    });

    builder.addBooleanSwitch({
      path: 'showStatus',
      name: 'Show charging status',
      defaultValue: true,
      category: ['Display'],
      description: 'Show Charging / Discharging / Stable indicator.',
    });

    // -- Data category --
    builder.addNumberInput({
      path: 'decimalPlaces',
      name: 'Decimal places',
      defaultValue: 2,
      settings: { min: 0, max: 6, integer: true },
      category: ['Data'],
      description: 'Decimal places for rate / low / high values.',
    });

    builder.addBooleanSwitch({
      path: 'useRegressionForRate',
      name: 'Use regression for rate',
      defaultValue: false,
      category: ['Data'],
      description: 'Compute %/min using least-squares regression instead of simple first/last difference.',
    });

    return builder;
  }
);
