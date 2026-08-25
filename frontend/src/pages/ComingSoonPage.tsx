import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext";
import { EmptyState } from "../components/shared/EmptyState";

export function ComingSoonPage({ titleKey, bodyKey }: { titleKey: string; bodyKey: string }) {
  const { t } = useTranslation();

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t(titleKey)}</h1>
      </header>
      <EmptyState
        title={t("common.comingSoon")}
        body={t(bodyKey)}
        action={
          <Link to="/reports">
            <button type="button" className="secondary">
              View report history
            </button>
          </Link>
        }
      />
    </div>
  );
}
