import { PanelPlugin, SelectableValue } from '@grafana/data';
import { ChargeVizPanel } from './components/ChargeVizPanel';
import { ChargeVizOptions } from './types';

/**
 * Build a list of selectable field identifiers from the panel's data frames.
 * Each option label shows "fieldName (refId)" so users can distinguish
 * fields from different queries.
 */
function buildFieldOptions(data: Array<{ fields: Array<{ name: string; type: string }>; refId?: string; name?: string }>): Array<SelectableValue<string>> {
  const opts: Array<SelectableValue<string>> = [
    { label: '— Auto (first number field)', value: '' },
  ];
  const seen = new Set<string>();

  for (const frame of data) {
    const label = frame.refId || frame.name || '';
    for (const field of frame.fields) {
      if (field.type === 'time') {
        continue;
      }
      // Use "refId:fieldName" as a unique key to handle multiple series
      // with identically-named fields.
      const key = label ? `${label}:${field.name}` : field.name;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const display = label ? `${field.name}  (${label})` : field.name;
      opts.push({ label: display, value: key });
    }
  }

  return opts;
}

export const plugin = new PanelPlugin<ChargeVizOptions>(ChargeVizPanel).setPanelOptions(
  (builder, context) => {
    const fieldOptions = buildFieldOptions(context.data ?? []);
    const fieldOptionsNoAuto = fieldOptions.filter((o) => o.value !== '');

    // -- Field Mapping category (top) --
    builder.addSelect({
      path: 'chargeField',
      name: 'Charge field',
      defaultValue: '',
      category: ['Field Mapping'],
      description: 'Numeric field for battery charge (0–100%).',
      settings: {
        allowCustomValue: true,
        isClearable: true,
        options: fieldOptions,
      },
    });

    builder.addBooleanSwitch({
      path: 'enableLoad',
      name: 'Enable load metric',
      defaultValue: false,
      category: ['Field Mapping'],
      description: 'Show a second metric representing current load / power draw.',
    });

    builder.addSelect({
      path: 'loadField',
      name: 'Load field',
      defaultValue: '',
      category: ['Field Mapping'],
      description: 'Numeric field for load percentage (0–100%).',
      settings: {
        allowCustomValue: true,
        isClearable: true,
        options: fieldOptionsNoAuto,
      },
      showIf: (opts) => opts.enableLoad === true,
    });

    builder.addBooleanSwitch({
      path: 'enableTimeLeft',
      name: 'Enable time remaining',
      defaultValue: false,
      category: ['Field Mapping'],
      description: 'Show estimated time remaining from a data field (value in minutes).',
    });

    builder.addSelect({
      path: 'timeLeftField',
      name: 'Time remaining field',
      defaultValue: '',
      category: ['Field Mapping'],
      description: 'Numeric field for estimated time remaining (in minutes).',
      settings: {
        allowCustomValue: true,
        isClearable: true,
        options: fieldOptionsNoAuto,
      },
      showIf: (opts) => opts.enableTimeLeft === true,
    });

    builder.addBooleanSwitch({
      path: 'enableStateField',
      name: 'Enable state field',
      defaultValue: false,
      category: ['Field Mapping'],
      description: 'Use a data field to determine charging / discharging state instead of inferring from the trend.',
    });

    builder.addSelect({
      path: 'stateField',
      name: 'State field',
      defaultValue: '',
      category: ['Field Mapping'],
      description: 'Field whose value indicates battery state.',
      settings: {
        allowCustomValue: true,
        isClearable: true,
        options: fieldOptionsNoAuto,
      },
      showIf: (opts) => opts.enableStateField === true,
    });

    builder.addTextInput({
      path: 'stateChargingValue',
      name: 'Charging value',
      defaultValue: 'charging',
      category: ['Field Mapping'],
      description: 'Value in the state field that means "charging" (case-insensitive).',
      showIf: (opts) => opts.enableStateField === true,
    });

    builder.addTextInput({
      path: 'stateDischargingValue',
      name: 'Discharging value',
      defaultValue: 'discharging',
      category: ['Field Mapping'],
      description: 'Value in the state field that means "discharging" (case-insensitive).',
      showIf: (opts) => opts.enableStateField === true,
    });

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
      description: 'Preferred orientation. Auto-reverts to vertical if the panel is too narrow for horizontal.',
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
