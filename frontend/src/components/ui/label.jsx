import React from "react";

const Label = React.forwardRef(({ children, htmlFor, className = "", ...props }, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = "Label";

export { Label }; 