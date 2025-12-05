"use client";

import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#fff",
          color: "#800000",
          border: "1px solid #800000",
          borderRadius: "8px",
          fontSize: "14px",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "#10b981", // Green color for success icon
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#fff",
          },
          style: {
            border: "1px solid #dc2626",
            color: "#dc2626",
          },
        },
      }}
    />
  );
};

export default ToastProvider;

