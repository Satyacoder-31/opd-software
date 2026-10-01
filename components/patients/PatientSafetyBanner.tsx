import {
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { meaningfulAllergyText } from "@/lib/consultation-utils";

type PatientSafetyBannerProps = {
  allergies?: string | null;
  chronicConditions?: string | null;
};

export function PatientSafetyBanner({
  allergies,
  chronicConditions,
}: PatientSafetyBannerProps) {
  const allergyText = meaningfulAllergyText(allergies);
  const chronicText = chronicConditions?.trim() || null;

  if (!allergyText && !chronicText) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3.5 py-3 text-xs dark:border-rose-900/40 dark:bg-rose-950/30">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15">
        <Icon icon={faShieldHalved} className="size-3.5 text-rose-600 dark:text-rose-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
          <Icon icon={faTriangleExclamation} className="size-3 shrink-0" />
          Patient safety alerts
        </p>
        {allergyText ? (
          <p className="text-rose-700 dark:text-rose-400">
            <span className="font-semibold">Allergies:</span> {allergyText}
          </p>
        ) : null}
        {chronicText ? (
          <p className="text-rose-700 dark:text-rose-400">
            <span className="font-semibold">Chronic conditions:</span> {chronicText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
