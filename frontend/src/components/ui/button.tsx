import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild: _, children, ...props }, ref) => {
    // 简化的类名组合
    let variantClass = "";
    switch (variant) {
      case "outline":
        variantClass = "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
        break;
      case "ghost":
        variantClass = "hover:bg-accent hover:text-accent-foreground";
        break;
      case "link":
        variantClass = "text-primary underline-offset-4 hover:underline";
        break;
      default:
        variantClass = "bg-primary text-primary-foreground hover:bg-primary/90";
    }

    let sizeClass = "";
    switch (size) {
      case "sm":
        sizeClass = "h-9 px-3 rounded-md";
        break;
      case "lg":
        sizeClass = "h-11 px-8 rounded-md";
        break;
      case "icon":
        sizeClass = "h-10 w-10 rounded-md";
        break;
      default:
        sizeClass = "h-10 px-4 py-2 rounded-md";
    }

    const baseClass = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    
    return (
      <button
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button"; 