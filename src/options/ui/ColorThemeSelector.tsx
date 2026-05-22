import { ColorTheme } from '../../types';
import { OptionsCoordinator } from '../coordinators/optionsCoordinator';

const THEMES: { value: ColorTheme; label: string }[] = [
  { value: 'humo',  label: 'Humo'  },
  { value: 'acera', label: 'Acera' },
  { value: 'mar',   label: 'Mar'   },
];

interface ColorThemeSelectorProps {
  coordinator: OptionsCoordinator;
  colorTheme: ColorTheme;
}

export default function ColorThemeSelector({ coordinator, colorTheme }: ColorThemeSelectorProps) {
  return (
    <div className="section">
      <h3 className="section-title">Color theme</h3>
      <div className="horizontal blocks equal-square wrap-allowed snug selectable-group">
        {THEMES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="switch"
            aria-checked={colorTheme === value}
            onClick={() => coordinator.setColorTheme(value)}
            className={`btn btn-outlined ${colorTheme === value ? 'is-selected' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
