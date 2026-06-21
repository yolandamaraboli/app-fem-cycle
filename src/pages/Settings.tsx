import { useState, useRef, useCallback } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCycleStore } from '../store/useCycleStore';
import { useTranslation } from '../i18n/index';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { Toast } from '../components/shared/Toast';

export function Settings() {
  const { t } = useTranslation();
  const { settings, updateSettings, exportData, importData, resetToDefaults, setLocale } =
    useSettingsStore();
  const { recalculatePhases, getActiveCycle, activeCycleId } = useCycleStore();

  // Local form state
  const [cycleLength, setCycleLength] = useState<string>(String(settings.cycleLengthAvg));
  const [periodDuration, setPeriodDuration] = useState<string>(String(settings.periodDurationAvg));
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1>(settings.firstDayOfWeek);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>(settings.exportFormat);
  const [locale, setLocaleLocal] = useState<'en' | 'es'>(settings.locale);

  // UI state
  const [showResetModal, setShowResetModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ cycleLength?: string; periodDuration?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((): boolean => {
    const newErrors: { cycleLength?: string; periodDuration?: string } = {};
    const cl = Number(cycleLength);
    const pd = Number(periodDuration);

    if (!Number.isInteger(cl) || cl < 26 || cl > 30) {
      newErrors.cycleLength = t('settings.validationCycleLength');
    }
    if (!Number.isInteger(pd) || pd < 3 || pd > 7) {
      newErrors.periodDuration = t('settings.validationPeriodDuration');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [cycleLength, periodDuration, t]);

  const handleSave = useCallback(() => {
    if (!validate()) return;

    const cl = Number(cycleLength);
    const pd = Number(periodDuration);

    const cycleLengthChanged = cl !== settings.cycleLengthAvg;
    const periodDurationChanged = pd !== settings.periodDurationAvg;

    updateSettings({
      cycleLengthAvg: cl,
      periodDurationAvg: pd,
      firstDayOfWeek,
      exportFormat,
      locale,
    });

    // Update locale globally
    if (locale !== settings.locale) {
      setLocale(locale);
    }

    // Recalculate phases if cycle params changed
    if ((cycleLengthChanged || periodDurationChanged) && activeCycleId) {
      const activeCycle = getActiveCycle();
      if (activeCycle) {
        recalculatePhases(activeCycle.id, {
          ...settings,
          cycleLengthAvg: cl,
          periodDurationAvg: pd,
          firstDayOfWeek,
          exportFormat,
          locale,
        });
      }
    }

    setToast({ message: t('settings.saveSuccess'), type: 'success' });
  }, [
    validate,
    cycleLength,
    periodDuration,
    firstDayOfWeek,
    exportFormat,
    locale,
    settings,
    updateSettings,
    setLocale,
    activeCycleId,
    getActiveCycle,
    recalculatePhases,
    t,
  ]);

  const handleExport = useCallback(() => {
    exportData(exportFormat);
    setToast({ message: t('settings.exportSuccess'), type: 'success' });
  }, [exportData, exportFormat, t]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setToast({ message: t('settings.importError'), type: 'error' });
          return;
        }

        const result = importData(text);
        if (result.success) {
          setToast({ message: t('settings.importSuccess'), type: 'success' });
          // Reload form state from updated store
          const updatedSettings = useSettingsStore.getState().settings;
          setCycleLength(String(updatedSettings.cycleLengthAvg));
          setPeriodDuration(String(updatedSettings.periodDurationAvg));
          setFirstDayOfWeek(updatedSettings.firstDayOfWeek);
          setExportFormat(updatedSettings.exportFormat);
          setLocaleLocal(updatedSettings.locale);
        } else {
          setToast({ message: result.error ?? t('settings.importError'), type: 'error' });
        }
      };
      reader.onerror = () => {
        setToast({ message: t('settings.importError'), type: 'error' });
      };
      reader.readAsText(file);

      // Reset file input so the same file can be re-selected
      e.target.value = '';
    },
    [importData, t]
  );

  const handleResetConfirm = useCallback(() => {
    resetToDefaults();
    // Reset local form state to defaults
    setCycleLength('28');
    setPeriodDuration('5');
    setFirstDayOfWeek(1);
    setExportFormat('json');
    setLocaleLocal('es');
    setErrors({});
    setShowResetModal(false);
    setToast({ message: t('settings.saveSuccess'), type: 'success' });
  }, [resetToDefaults, t]);

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-text-primary">{t('settings.title')}</h1>

      {/* Cycle Configuration */}
      <Card>
        <div className="space-y-5">
          {/* Cycle Length */}
          <div>
            <label
              htmlFor="cycleLength"
              className="block text-body font-medium text-text-primary mb-1"
            >
              {t('settings.cycleLength')}
            </label>
            <input
              id="cycleLength"
              type="number"
              min={26}
              max={30}
              step={1}
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              aria-describedby="cycleLengthHelp"
              aria-invalid={!!errors.cycleLength}
              className={[
                'w-full px-3 py-2.5 min-h-[44px] rounded-button border',
                'text-body text-text-primary bg-background',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'transition-fast',
                errors.cycleLength ? 'border-coral' : 'border-border',
              ].join(' ')}
            />
            <p id="cycleLengthHelp" className="mt-1 text-body-sm text-text-secondary">
              {t('settings.cycleLengthHelp')}
            </p>
            {errors.cycleLength && (
              <p className="mt-1 text-body-sm text-coral" role="alert">
                {errors.cycleLength}
              </p>
            )}
          </div>

          {/* Period Duration */}
          <div>
            <label
              htmlFor="periodDuration"
              className="block text-body font-medium text-text-primary mb-1"
            >
              {t('settings.periodDuration')}
            </label>
            <input
              id="periodDuration"
              type="number"
              min={3}
              max={7}
              step={1}
              value={periodDuration}
              onChange={(e) => setPeriodDuration(e.target.value)}
              aria-describedby="periodDurationHelp"
              aria-invalid={!!errors.periodDuration}
              className={[
                'w-full px-3 py-2.5 min-h-[44px] rounded-button border',
                'text-body text-text-primary bg-background',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'transition-fast',
                errors.periodDuration ? 'border-coral' : 'border-border',
              ].join(' ')}
            />
            <p id="periodDurationHelp" className="mt-1 text-body-sm text-text-secondary">
              {t('settings.periodDurationHelp')}
            </p>
            {errors.periodDuration && (
              <p className="mt-1 text-body-sm text-coral" role="alert">
                {errors.periodDuration}
              </p>
            )}
          </div>

          {/* First Day of Week */}
          <div>
            <label
              htmlFor="firstDayOfWeek"
              className="block text-body font-medium text-text-primary mb-1"
            >
              {t('settings.firstDayOfWeek')}
            </label>
            <select
              id="firstDayOfWeek"
              value={firstDayOfWeek}
              onChange={(e) => setFirstDayOfWeek(Number(e.target.value) as 0 | 1)}
              className={[
                'w-full px-3 py-2.5 min-h-[44px] rounded-button border border-border',
                'text-body text-text-primary bg-background',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'transition-fast',
              ].join(' ')}
            >
              <option value={1}>{t('settings.monday')}</option>
              <option value={0}>{t('settings.sunday')}</option>
            </select>
          </div>

          {/* Export Format */}
          <div>
            <label
              htmlFor="exportFormat"
              className="block text-body font-medium text-text-primary mb-1"
            >
              {t('settings.exportFormat')}
            </label>
            <select
              id="exportFormat"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
              className={[
                'w-full px-3 py-2.5 min-h-[44px] rounded-button border border-border',
                'text-body text-text-primary bg-background',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'transition-fast',
              ].join(' ')}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label
              htmlFor="locale"
              className="block text-body font-medium text-text-primary mb-1"
            >
              {t('settings.language')}
            </label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => setLocaleLocal(e.target.value as 'en' | 'es')}
              className={[
                'w-full px-3 py-2.5 min-h-[44px] rounded-button border border-border',
                'text-body text-text-primary bg-background',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'transition-fast',
              ].join(' ')}
            >
              <option value="es">{t('settings.spanish')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <h2 className="text-h3 font-semibold text-text-primary mb-4">
          {t('settings.dataManagement')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            {t('settings.exportData')}
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            {t('settings.importData')}
          </Button>
          <Button variant="ghost" onClick={() => setShowResetModal(true)}>
            {t('settings.resetDefaults')}
          </Button>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={t('settings.resetConfirmTitle')}
      >
        <p className="text-body text-text-secondary mb-6">
          {t('settings.resetConfirmMessage')}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleResetConfirm}>
            {t('settings.resetConfirm')}
          </Button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
