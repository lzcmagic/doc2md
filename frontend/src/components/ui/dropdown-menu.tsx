import React, { createContext, useContext, useState, useEffect } from "react";

// 创建上下文
const DropdownMenuContext = createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ children, asChild: _, ...props }, ref) => {
  const { setOpen, triggerRef } = useContext(DropdownMenuContext);
  
  // 组合 ref
  const combinedRef = (node: HTMLButtonElement) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
    triggerRef.current = node;
  };

  return (
    <button
      type="button"
      ref={combinedRef}
      onClick={() => setOpen((prev) => !prev)}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  );
});

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  children: React.ReactNode;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ children, className = "", align = "center", ...props }, ref) => {
  const { open, setOpen, triggerRef } = useContext(DropdownMenuContext);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  
  // 将前向的 ref 与本地 ref 合并
  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

  // 使用状态存储是否可见，避免条件 Hook
  const [visible, setVisible] = React.useState(open);
  
  React.useEffect(() => {
    setVisible(open);
  }, [open]);

  // 始终先渲染 Hook，不论组件是否会显示
  useEffect(() => {
    if (!visible) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, setOpen, triggerRef]);

  if (!visible) return null;

  // 添加对齐方式的样式
  let alignClass = "";
  switch (align) {
    case "start":
      alignClass = "left-0";
      break;
    case "end":
      alignClass = "right-0";
      break;
    default:
      alignClass = "left-1/2 transform -translate-x-1/2";
  }

  return (
    <div
      ref={contentRef}
      className={`z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md absolute mt-1 ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className = "", children, ...props }, ref) => {
  const { setOpen } = useContext(DropdownMenuContext);

  return (
    <button
      ref={ref}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left ${className}`}
      onClick={(e) => {
        setOpen(false);
        if (props.onClick) props.onClick(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});

DropdownMenuItem.displayName = "DropdownMenuItem"; 