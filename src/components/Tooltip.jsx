const Tooltip = ({
  text,
  kbd,
  position = "top",
  color = "neutral",
  children,
  className = "",
}) => {
  // Color styling map
  const colorStyles = {
    neutral: "border-base-content/10 bg-neutral text-neutral-content shadow-neutral/30",
    warning: "border-warning/30 bg-neutral text-warning shadow-warning/20",
    error: "border-error/30 bg-neutral text-error shadow-error/20",
    info: "border-info/30 bg-neutral text-info shadow-info/20",
    success: "border-success/30 bg-neutral text-success shadow-success/20",
    primary: "border-primary/30 bg-neutral text-primary shadow-primary/20",
  };

  const chosenColor = colorStyles[color] || colorStyles.neutral;

  // Position offset map
  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  };

  // Arrow styles
  const arrowStyles = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-neutral border-l-transparent border-r-transparent border-b-transparent border-[5px]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-neutral border-l-transparent border-r-transparent border-t-transparent border-[5px]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-neutral border-t-transparent border-b-transparent border-r-transparent border-[5px]",
    right: "right-full top-1/2 -translate-y-1/2 border-r-neutral border-t-transparent border-b-transparent border-l-transparent border-[5px]",
  };

  return (
    <div className={`relative inline-flex items-center justify-center group/tooltip ${className}`}>
      {children}

      <div
        role="tooltip"
        className={`pointer-events-none absolute z-40 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border shadow-xl backdrop-blur-md opacity-0 scale-90 translate-y-1 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-hover/tooltip:translate-y-0 transition-all duration-150 ease-out select-none ${positionStyles[position]} ${chosenColor}`}
      >
        <span>{text}</span>
        {kbd && (
          <kbd className="kbd kbd-xs text-[10px] py-0 px-1 font-mono font-bold bg-base-100/30 text-current border border-white/20 rounded shadow-inner">
            {kbd}
          </kbd>
        )}
        <span className={`absolute w-0 h-0 ${arrowStyles[position]}`} />
      </div>
    </div>
  );
};

export default Tooltip;
