import { useTranslation } from "../../i18n/LanguageContext";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="state-block state-error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
