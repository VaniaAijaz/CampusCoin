import toast from "react-hot-toast";
import { AlertCircle, X } from "lucide-react";

/**
 * Display an Aurora Sapphire frosted-glass toast notification containing the sanitized message
 * and appending the [errorCode] in a subtle font so users can report the bug easily.
 *
 * @param {Error|Object} error - Error object (e.g., AxiosError or standard Error)
 * @param {string} [fallbackMessage] - Optional fallback message
 */
export const showFrostedErrorToast = (error, fallbackMessage) => {
  const resData = error?.response?.data;
  const errorCode = resData?.errorCode || (error?.code ? `ERR_${error.code}` : "ERR_SYS_UNKNOWN");
  const message =
    resData?.message ||
    (typeof error === "string" ? error : error?.message) ||
    fallbackMessage ||
    "An unexpected error occurred. Please try again.";

  // Avoid spamming identical toasts
  const toastId = `error-${errorCode}-${message}`;

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        } transition-all duration-300 pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6)] max-w-sm sm:max-w-md w-full`}
        role="alert"
      >
        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-3xs font-bold uppercase tracking-wider text-rose-300">
              Notification
            </span>
            <span className="text-3xs font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/10 tracking-wider">
              [{errorCode}]
            </span>
          </div>
          <p className="text-xs font-semibold text-white/90 mt-1 leading-snug break-words">
            {message}
          </p>
        </div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-white/40 hover:text-white p-1 rounded-lg transition-colors shrink-0"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    {
      id: toastId,
      duration: 5000,
      position: "top-right",
    }
  );
};

export default showFrostedErrorToast;
