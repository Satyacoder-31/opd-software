"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { faMinus } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-sm border border-border bg-background text-base font-medium text-ink shadow-sm transition-[border-color,box-shadow,background-color] outline-none sm:size-12",
        "aria-invalid:border-destructive",
        "data-[active=true]:z-10 data-[active=true]:border-transparent data-[active=true]:ring-3 data-[active=true]:ring-primary/25",
        "data-[active=true]:aria-invalid:border-transparent data-[active=true]:aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      ) : null}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center text-muted-foreground"
      role="separator"
      {...props}
    >
      <Icon icon={faMinus} className="size-3.5" aria-hidden />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
