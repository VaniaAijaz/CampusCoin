/**
 * NumberTicker — GSAP value roll-up from 0 → target
 * Usage: <NumberTicker value={1234.56} prefix="$" decimals={2} />
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NumberTicker({
  value = 0,
  prefix = "",
  suffix = "",
  decimals = 2,
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
          elRef.current.textContent =
            prefix +
            objRef.current.val.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }) +
            suffix;
        }
      },
    });
  }, [value]); // eslint-disable-line

  return (
    <span ref={elRef} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
