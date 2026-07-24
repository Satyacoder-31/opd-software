import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Icon>, "icon">) {
  return (
    <Icon
      icon={faSpinner}
      spin
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4", className)}
      {...props}
    />
  );
}

export { Spinner };
