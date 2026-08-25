import { useTranslation } from "../../i18n/LanguageContext";

export type DataStatus = "verified" | "estimated" | "user-provided" | "insufficient";

interface Props {
  status: DataStatus;
  source?: string;
}

// Reusable per spec section 11 ("Data Transparency") — every displayed number should be
// able to show where it came from and how much to trust it.
export function DataSourceBadge({ status, source }: Props) {
  const { t } = useTranslation();

  const label =
    status === "verified"
      ? t("common.verified")
      : status === "estimated"
        ? t("common.estimated")
        : status === "user-provided"
          ? t("common.userProvided")
          : t("common.insufficientData");

  return (
    <span className="data-source-badge" data-status={status}>
      {label}
      {source && <span className="data-source-badge-source">· {source}</span>}
    </span>
  );
}
