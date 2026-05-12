import { Lang } from '../../types';
import { OptionsCoordinator } from '../coordinators/optionsCoordinator';

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

interface LanguageSelectorProps {
  coordinator: OptionsCoordinator;
  language: Lang;
}

export default function LanguageSelector({ coordinator, language }: LanguageSelectorProps) {
  return (
    <div className="section">
      <h3 className="section-title">Language / Idioma</h3>
      <div className="horizontal blocks equal-square wrap-allowed snug selectable-group">
        {LANGUAGES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="switch"
            aria-checked={language === value}
            onClick={() => coordinator.setLanguage(value)}
            className={`btn btn-outlined ${language === value ? 'is-selected' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
