"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/app/(dashboard)/settings/actions";

// Runs a settings server action and reports the result as a toast.
export function useActionToast(
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>,
  success: string,
) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.ok) toast.success(success);
  }, [state, success]);

  return [formAction, pending] as const;
}
