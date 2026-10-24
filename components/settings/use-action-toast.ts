"use client";

import { type FormEvent, startTransition, useActionState, useEffect } from "react";
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

  // Submit through onSubmit, not <form action>: React resets an action form after
  // every submit, which would wipe the Owner's edits when the server rejects them.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => formAction(form));
  }

  return [onSubmit, pending] as const;
}
