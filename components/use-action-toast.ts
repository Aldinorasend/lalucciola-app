"use client";

import { type FormEvent, startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
export type ActionResult = { ok?: boolean; error?: string } | undefined;

// Runs a server action from a form and reports the result as a toast.
export function useActionToast(
  action: (previous: ActionResult, form: FormData) => Promise<ActionResult>,
  success: string,
  onSuccess?: () => void,
) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.ok) {
      toast.success(success);
      onSuccess?.();
    }
    // onSuccess is left out on purpose: run once per result, not when the callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, success]);

  // Submit through onSubmit, not <form action>: React resets an action form after
  // every submit, which would wipe the user's edits when the server rejects them.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => formAction(form));
  }

  return [onSubmit, pending] as const;
}
