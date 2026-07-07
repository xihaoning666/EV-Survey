import type { Likert5 } from '../types';
import { LIKERT_LABELS } from '../data/constants';

interface RadioGroupProps {
  label: string;
  hint?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}

export function RadioGroup({ label, hint, options, value, onChange, name }: RadioGroupProps) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {hint && <p className="hint">{hint}</p>}
      <div className="options" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <label key={opt} className={`option ${value === opt ? 'selected' : ''}`}>
            <input
              type="radio"
              name={name}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface CheckboxGroupProps {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
}

export function CheckboxGroup({ label, options, values, onChange, max }: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else if (!max || values.length < max) {
      onChange([...values, opt]);
    }
  };
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {max && <p className="hint">Select up to {max}</p>}
      <div className="options">
        {options.map((opt) => (
          <label key={opt} className={`option ${values.includes(opt) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={values.includes(opt)}
              onChange={() => toggle(opt)}
              disabled={!!max && !values.includes(opt) && values.length >= max}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface NumericFieldProps {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  suffix?: string;
  min?: number;
  max?: number;
}

export function NumericField({ label, hint, value, onChange, suffix, min, max }: NumericFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={label}>{label}</label>
      {hint && <p className="hint">{hint}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {suffix?.startsWith('$') && <span>{suffix.charAt(0)}</span>}
        <input
          id={label}
          className="numeric-input"
          type="number"
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            onChange(v);
          }}
        />
        {suffix && !suffix.startsWith('$') && <span>{suffix}</span>}
        {suffix?.startsWith('$') && <span>{suffix.slice(1)}</span>}
      </div>
    </div>
  );
}

interface LikertGridProps {
  items: { id: string; text: string }[];
  values: Record<string, Likert5 | null>;
  onChange: (id: string, v: Likert5) => void;
}

export function LikertGrid({ items, values, onChange }: LikertGridProps) {
  return (
    <div>
      <p className="intro">Please say how much you agree with each statement.</p>
      {items.map(({ id, text }) => (
        <div key={id} className="likert-row">
          <p>{text}</p>
          <div className="likert-scale" role="radiogroup" aria-label={text}>
            {LIKERT_LABELS.map((lbl, idx) => {
              const val = (idx + 1) as Likert5;
              return (
                <button
                  key={lbl}
                  type="button"
                  className={`likert-btn ${values[id] === val ? 'selected' : ''}`}
                  onClick={() => onChange(id, val)}
                  aria-pressed={values[id] === val}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface GridFrequencyProps {
  label: string;
  rows: string[];
  columns: string[];
  values: Record<string, string>;
  onChange: (row: string, col: string) => void;
}

export function GridFrequency({ label, rows, columns, values, onChange }: GridFrequencyProps) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div style={{ overflowX: 'auto' }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th />
              {columns.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td>{row}</td>
                {columns.map((col) => (
                  <td key={col}>
                    <input
                      type="radio"
                      name={`grid-${row}`}
                      checked={values[row] === col}
                      onChange={() => onChange(row, col)}
                      aria-label={`${row}: ${col}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
