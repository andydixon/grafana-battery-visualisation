// Import PanelPlugin to register our React component as a Grafana panel.
import { PanelPlugin } from '@grafana/data';
// Import the component itself.
import { ChargeVizPanel } from './components/ChargeVizPanel';

/**
 * Re-declare the options interface here to keep this file self-contained for the editor.
 * These must match the props used in ChargeVizPanel.
 */
interface ChargeVizOptions {
  lowColour: string;
  midColour: string;
  highColour: string;
  gradientFill: boolean;
  decimalPlaces: number;
  useRegressionForRate: boolean;
}

/**
 * Export the plugin instance that Grafana will discover.
 * We also define the panel editor options so users can configure colours and behaviour.
 */
export const plugin = new PanelPlugin<ChargeVizOptions>(ChargeVizPanel).setPanelOptions(
  // The builder lets us declare editor controls (colour pickers, switches, number inputs).
  (builder) => {
    // Colour: low battery
    builder.addColorPicker({
      path: 'lowColour',                 // option field name
      name: 'Low battery colour',        // label in the editor
      defaultValue: '#F44336',           // sensible default (red)
      description: 'Colour when the level is under 30%.',
    });

    // Colour: medium battery
    builder.addColorPicker({
      path: 'midColour',
      name: 'Medium battery colour',
      defaultValue: '#FF9800',           // amber
      description: 'Colour when the level is between 30% and 70%.',
    });

    // Colour: high battery
    builder.addColorPicker({
      path: 'highColour',
      name: 'High battery colour',
      defaultValue: '#4CAF50',           // green
      description: 'Colour when the level is above 70%.',
    });

    // Toggle for gradient fill.
    builder.addBooleanSwitch({
      path: 'gradientFill',
      name: 'Enable gradient fill',
      defaultValue: true,
      description: 'Show a subtle gradient that hints charging/discharging.',
    });

    // Numeric input: decimal places for numbers shown in the stats.
    builder.addNumberInput({
      path: 'decimalPlaces',
      name: 'Decimal places',
      defaultValue: 2,
      settings: { min: 0, max: 6, integer: true },
      description: 'How many decimal places to use for rate/low/high.',
    });

    builder.addBooleanSwitch({
      path: 'hideText',
      name: 'Hide stats text (battery only)',
      defaultValue: false,
      description: 'If enabled, hides the rate and high/low text, showing only the battery graphic.',
    });


    // Toggle: use regression for rate instead of simple first/last.
    builder.addBooleanSwitch({
      path: 'useRegressionForRate',
      name: 'Use regression for rate',
      defaultValue: false,
      description:
        'Compute %/min using more complicated maths.',
    });

    // Return the builder so Grafana applies the options.
    return builder;
  }
);
