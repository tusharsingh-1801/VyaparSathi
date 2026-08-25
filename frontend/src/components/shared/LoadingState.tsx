import { useTranslation } from "../../i18n/LanguageContext";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="state-block state-loading">
      <div className="spinner" />
      <p>{label ?? t("common.loading")}</p>
    </div>
  );
}
