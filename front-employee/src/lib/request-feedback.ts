import { toast } from "sonner";
import { getErrorMessage } from "./http-error";

export function showRequestErrorToast(error: unknown, toastId: string) {
  const message = getErrorMessage(error);
  toast.error(message, { id: toastId });
  return message;
}

export function dismissRequestToast(toastId: string) {
  toast.dismiss(toastId);
}
