import { IconButton } from "./IconButton";
import { cn } from "./cn";

export function PlayButton({
  playing,
  onClick,
  className,
  overlay,
  label,
}: {
  playing: boolean;
  onClick?: () => void;
  className?: string;
  overlay?: boolean;
  label?: string;
}) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={label || (playing ? "Tạm dừng" : "Phát")}
      className={cn(
        "text-lg",
        overlay ? "absolute inset-0 h-full w-full rounded-[inherit]" : className ? undefined : "h-10 w-10",
        className,
      )}
    >
      {playing ? "❚❚" : "▶"}
    </IconButton>
  );
}
