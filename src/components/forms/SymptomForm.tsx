import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n';
import { useSymptomStore } from '../../store/useSymptomStore';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Toast } from '../shared/Toast';
import { ScaleInput } from './ScaleInput';
import { SelectInput } from './SelectInput';
import { TagInput } from './TagInput';
import type { SymptomLog, FlowLevel, MucusType } from '../../types';

interface SymptomFormProps {
  date: string;
}

function createEmptyLog(date: string): SymptomLog {
  return {
    date,
    physical: {
      cramps: 0,
      backPain: 0,
      headache: 0,
      bloating: 0,
      breastTenderness: 0,
      fatigue: 0,
      nausea: 0,
      acne: 0,
    },
    emotional: {
      moodSwings: 0,
      anxiety: 0,
      sadness: 0,
      irritability: 0,
      energy: 0,
    },
    hormonal: {
      flow: 'none' as FlowLevel,
      cervicalMucus: 'dry' as MucusType,
    },
    libido: 0,
    appetite: 0,
    sleep: 8,
    weight: null,
    temperature: null,
    notes: '',
    tags: [],
  };
}

export function SymptomForm({ date }: SymptomFormProps) {
  const { t } = useTranslation();
  const saveLog = useSymptomStore((s) => s.saveLog);
  const getLogByDate = useSymptomStore((s) => s.getLogByDate);

  const [log, setLog] = useState<SymptomLog>(() => {
    const existing = getLogByDate(date);
    return existing ?? createEmptyLog(date);
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load existing data when date changes
  useEffect(() => {
    const existing = getLogByDate(date);
    setLog(existing ?? createEmptyLog(date));
  }, [date, getLogByDate]);

  const updatePhysical = useCallback((key: string, value: number) => {
    setLog((prev) => ({
      ...prev,
      physical: { ...prev.physical, [key]: value },
    }));
  }, []);

  const updateEmotional = useCallback((key: string, value: number) => {
    setLog((prev) => ({
      ...prev,
      emotional: { ...prev.emotional, [key]: value },
    }));
  }, []);

  const handleSave = () => {
    try {
      saveLog(log);
      setToast({ message: t('common.save') + ' ✓', type: 'success' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        setToast({ message: t('errors.storageFull'), type: 'error' });
      } else {
        setToast({ message: t('errors.generic'), type: 'error' });
      }
      // Data stays in form - no reset
    }
  };

  const flowOptions: FlowLevel[] = ['none', 'light', 'medium', 'heavy', 'spotting'];
  const mucusOptions: MucusType[] = ['dry', 'sticky', 'creamy', 'eggWhite', 'watery'];

  const physicalKeys = Object.keys(log.physical) as (keyof typeof log.physical)[];
  const emotionalKeys = Object.keys(log.emotional) as (keyof typeof log.emotional)[];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="flex flex-col gap-6"
    >
      {/* Physical Symptoms */}
      <Card>
        <h2 className="text-h3 font-semibold text-text-primary mb-4">
          {t('symptoms.physical.cramps') ? t('nav.dailyLog') : 'Physical'}
        </h2>
        <fieldset>
          <legend className="text-body font-semibold text-text-primary mb-3">
            {t('nav.dailyLog')} — Physical
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {physicalKeys.map((key) => (
              <ScaleInput
                key={key}
                id={`physical-${key}`}
                label={t(`symptoms.physical.${key}`)}
                value={log.physical[key]}
                onChange={(v) => updatePhysical(key, v)}
              />
            ))}
          </div>
        </fieldset>
      </Card>

      {/* Emotional Symptoms */}
      <Card>
        <fieldset>
          <legend className="text-body font-semibold text-text-primary mb-3">
            {t('nav.dailyLog')} — Emotional
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {emotionalKeys.map((key) => (
              <ScaleInput
                key={key}
                id={`emotional-${key}`}
                label={t(`symptoms.emotional.${key}`)}
                value={log.emotional[key]}
                onChange={(v) => updateEmotional(key, v)}
              />
            ))}
          </div>
        </fieldset>
      </Card>

      {/* Hormonal Symptoms */}
      <Card>
        <fieldset>
          <legend className="text-body font-semibold text-text-primary mb-3">
            Hormonal
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              id="flow-select"
              label={t('flow.none') ? 'Flow' : 'Flow'}
              value={log.hormonal.flow}
              onChange={(v) =>
                setLog((prev) => ({
                  ...prev,
                  hormonal: { ...prev.hormonal, flow: v as FlowLevel },
                }))
              }
              options={flowOptions.map((f) => ({ value: f, label: t(`flow.${f}`) }))}
            />
            <SelectInput
              id="mucus-select"
              label="Cervical Mucus"
              value={log.hormonal.cervicalMucus}
              onChange={(v) =>
                setLog((prev) => ({
                  ...prev,
                  hormonal: { ...prev.hormonal, cervicalMucus: v as MucusType },
                }))
              }
              options={mucusOptions.map((m) => ({ value: m, label: t(`mucus.${m}`) }))}
            />
          </div>
        </fieldset>
      </Card>

      {/* Other scales: libido, appetite */}
      <Card>
        <fieldset>
          <legend className="text-body font-semibold text-text-primary mb-3">
            Other
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ScaleInput
              id="libido"
              label="Libido"
              value={log.libido}
              onChange={(v) => setLog((prev) => ({ ...prev, libido: v }))}
            />
            <ScaleInput
              id="appetite"
              label="Appetite"
              value={log.appetite}
              onChange={(v) => setLog((prev) => ({ ...prev, appetite: v }))}
            />
          </div>
        </fieldset>
      </Card>

      {/* Numeric inputs: sleep, weight, temperature */}
      <Card>
        <fieldset>
          <legend className="text-body font-semibold text-text-primary mb-3">
            Metrics
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sleep */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sleep" className="text-body-sm font-medium text-text-primary">
                Sleep (hours)
              </label>
              <input
                id="sleep"
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={log.sleep}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 24) {
                    setLog((prev) => ({ ...prev, sleep: val }));
                  }
                }}
                className={[
                  'px-3 py-2 min-h-[44px]',
                  'rounded-button border border-border',
                  'bg-card text-text-primary text-body-sm',
                  'transition-fast',
                  'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                ].join(' ')}
              />
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weight" className="text-body-sm font-medium text-text-primary">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                min={30}
                max={300}
                step={0.1}
                value={log.weight ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setLog((prev) => ({ ...prev, weight: null }));
                    return;
                  }
                  const val = parseFloat(raw);
                  if (!isNaN(val) && val >= 30 && val <= 300) {
                    setLog((prev) => ({ ...prev, weight: val }));
                  }
                }}
                placeholder="Optional"
                className={[
                  'px-3 py-2 min-h-[44px]',
                  'rounded-button border border-border',
                  'bg-card text-text-primary text-body-sm',
                  'placeholder:text-text-secondary',
                  'transition-fast',
                  'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                ].join(' ')}
              />
            </div>

            {/* Temperature */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="temperature" className="text-body-sm font-medium text-text-primary">
                Temperature (°C)
              </label>
              <input
                id="temperature"
                type="number"
                min={35}
                max={42}
                step={0.1}
                value={log.temperature ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setLog((prev) => ({ ...prev, temperature: null }));
                    return;
                  }
                  const val = parseFloat(raw);
                  if (!isNaN(val) && val >= 35 && val <= 42) {
                    setLog((prev) => ({ ...prev, temperature: val }));
                  }
                }}
                placeholder="Optional"
                className={[
                  'px-3 py-2 min-h-[44px]',
                  'rounded-button border border-border',
                  'bg-card text-text-primary text-body-sm',
                  'placeholder:text-text-secondary',
                  'transition-fast',
                  'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                ].join(' ')}
              />
            </div>
          </div>
        </fieldset>
      </Card>

      {/* Notes and Tags */}
      <Card>
        <fieldset>
          <legend className="text-body font-semibold text-text-primary mb-3">
            Notes & Tags
          </legend>
          <div className="flex flex-col gap-4">
            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-body-sm font-medium text-text-primary">
                Notes ({log.notes.length}/500)
              </label>
              <textarea
                id="notes"
                value={log.notes}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 500) {
                    setLog((prev) => ({ ...prev, notes: val }));
                  }
                }}
                maxLength={500}
                rows={3}
                placeholder="How are you feeling today?"
                className={[
                  'px-3 py-2 min-h-[44px]',
                  'rounded-button border border-border',
                  'bg-card text-text-primary text-body-sm',
                  'placeholder:text-text-secondary',
                  'transition-fast resize-y',
                  'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                ].join(' ')}
              />
            </div>

            {/* Tags */}
            <TagInput
              id="tags"
              label="Tags"
              tags={log.tags}
              onChange={(tags) => setLog((prev) => ({ ...prev, tags }))}
            />
          </div>
        </fieldset>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg">
          {t('common.save')}
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  );
}
