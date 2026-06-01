"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full py-4 hidden  md:flex md:flex-col bg-header dark:bg-neutral-800 w-[120px] shrink-0",
          className,
        )}
        animate={{
          width: animate ? (open ? "140px" : "60px") : "140px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full",
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-header dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className,
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const { pathname } = useLocation();
  const [isHovered, setIsHovered] = useState(false); // Track hover state locally

  const isActive = pathname.startsWith(link.href);

  return (
    <div className="w-full px-2">
      <Link
        to={link.href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative !no-underline flex items-center font-bold py-2 w-full rounded-lg overflow-hidden transition-colors",
          className,
        )}
        onClick={(e) => {
          if (link.onClick) {
            e.preventDefault();
            link.onClick();
          }
        }}
        {...props}
      >
        {/* Highlight Background (Active OR Hover) */}
        <motion.span
          className="absolute inset-0 rounded-lg -z-0"
          animate={{
            backgroundColor: isActive
              ? "rgba(255, 255, 255, 0.2)" // Stronger highlight for active
              : isHovered
                ? "rgba(255, 255, 255, 0.1)" // Subtle highlight for hover
                : "rgba(255, 255, 255, 0)", // Transparent
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Icon Container */}
        <motion.span
          className="relative z-10 shrink-0 w-6 h-6 flex items-center justify-center"
          animate={{
            marginLeft: open ? "8px" : "auto",
            marginRight: open ? "8px" : "auto",
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {link.icon}
        </motion.span>

        {/* Label */}
        <motion.span
          animate={{
            width: animate ? (open ? "auto" : 0) : "auto",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
          className="relative z-10 text-neutral-200 text-sm whitespace-pre !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </Link>
    </div>
  );
};
