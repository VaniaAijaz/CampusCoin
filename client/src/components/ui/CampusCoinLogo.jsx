import CampusCoinIcon from "./CampusCoinIcon";

const cfg = {
  sm: { icon: 32, nameSize: "text-base",   subSize: "text-[7.5px]", gap: "gap-2.5" },
  md: { icon: 38, nameSize: "text-[18px]", subSize: "text-[8.5px]", gap: "gap-3"   },
  lg: { icon: 46, nameSize: "text-2xl",    subSize: "text-[10px]",  gap: "gap-3.5" },
};

export default function CampusCoinLogo({ size = "md", className = "" }) {
  const { icon, nameSize, subSize, gap } = cfg[size] || cfg.md;

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {/* Icon: always visible */}
      <CampusCoinIcon size={icon} className="shrink-0" />

      {/* Name: visible from 400px+ */}
      <div className="hidden [@media(min-width:400px)]:flex flex-col justify-center leading-none">
        {/* <span
          className={`${nameSize} font-black text-white leading-none`}
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif", letterSpacing: "-0.04em" }}
        >
          CampusCoin<span style={{ color: "#5170FF" }}>.</span>
        </span> */}
        <span
          className={`${nameSize} font-bold text-white leading-none`}
          style={{
            fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          CampusCoin.
        </span>



        {/* Tagline: visible from 450px+ */}
        {/* <span
          className={`${subSize} text-white/55 font-light uppercase mt-[3px] hidden [@media(min-width:450px)]:block`}
          style={{ letterSpacing: "0.18em" }}
        >
          Where Student Life Meets Smart Finance.
        </span> */}
      </div>
    </div>
  );
}
