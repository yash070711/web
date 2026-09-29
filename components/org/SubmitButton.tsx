"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  disabled,
  title,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending || disabled} title={title}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
