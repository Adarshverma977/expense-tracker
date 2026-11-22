import { toast } from "sonner";

const appToast = {
  success: (message) => toast.success(message),

  error: (message) => toast.error(message),

  warning: (message) => toast.warning(message),

  info: (message) => toast.info(message),

  loading: (message) => toast.loading(message),

  message: (message) => toast(message),

  promise: (promise, messages) => toast.promise(promise, messages),

  dismiss: (id) => toast.dismiss(id),
};

export default appToast;
