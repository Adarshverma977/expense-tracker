
import { Toaster } from "sonner";

const AppToast = () => {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3500}
      expand={false}
      visibleToasts={4}
      toastOptions={{
        style: {
          fontFamily: "Manrope, sans-serif",
          borderRadius: "14px",
          padding: "14px 16px",
        },
      }}
    />
  );
};

export default AppToast;
