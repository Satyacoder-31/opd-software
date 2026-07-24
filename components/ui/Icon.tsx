import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";

export type IconProps = Omit<FontAwesomeIconProps, "icon"> & {
  icon: IconDefinition;
};

/**
 * App-wide Font Awesome icon. Prefer this over raw FontAwesomeIcon so sizing
 * and aria defaults stay consistent with button / empty-state patterns.
 */
export function Icon({ icon, className, ...props }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={cn("size-[1.05em] shrink-0", className)}
      {...props}
    />
  );
}
