import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  onClick,
}: {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      to="/"
      aria-label={onClick ? "TerraPulse AI, back to top" : "TerraPulse AI home"}
      onClick={onClick}
      className={cn(
        "group -m-1 flex items-center gap-2.5 rounded-full p-1 pr-2 outline-none transition-colors duration-300 hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-lime",
        className,
      )}
    >
      <span className="relative grid h-8 w-8 place-items-center">
        <svg
          viewBox="0 0 32 32"
          className="h-8 w-8 transition-transform duration-500 ease-out group-hover:rotate-[24deg] group-hover:scale-110 group-focus-visible:rotate-[24deg] group-focus-visible:scale-110"
          aria-hidden
        >
          <circle cx="16" cy="16" r="11" fill="none" stroke="var(--eco)" strokeWidth="1.4" />
          <path
            d="M3 17h7l3-6 4 11 3-8 2 3h7"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[15px] font-medium tracking-tight transition-colors duration-300 group-hover:text-lime group-focus-visible:text-lime">
        TerraPulse <span className="text-muted-foreground">AI</span>
      </span>
    </Link>
  );
}
