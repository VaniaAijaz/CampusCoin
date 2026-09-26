/**
 * NumberTicker — GSAP value roll-up from 0 → target
 * Usage: <NumberTicker value={1234.56} currencyCode="USD" />
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { formatCurrency } from "../../utils/currencyUtils";

export default function NumberTicker({
  value = 0,
  prefix = "",
  suffix = "",
  decimals = 2,
  currencyCode = null,
  duration = 1.2,
  ease = "power3.out",
  className = "",
}) {
  const elRef = useRef(null);
  const objRef = useRef({ val: 0 });

  useEffect(() => {
    if (!elRef.current) return;
    const target = Number(value) || 0;

    gsap.to(objRef.current, {
      val: target,
      duration,
      ease,
      onUpdate() {
        if (elRef.current) {
          if (currencyCode) {
            elRef.current.textContent = formatCurrency(objRef.current.val, currencyCode);
          } else {
            elRef.current.textContent =
              prefix +
              objRef.current.val.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) +
              suffix;
          }
        }
      },
    });
  }, [value, currencyCode, prefix, suffix, decimals]); // eslint-disable-line

  return (
    <span ref={elRef} className={className}>
      {currencyCode ? formatCurrency(0, currencyCode) : `${prefix}0${suffix}`}
    </span>
  );
}
