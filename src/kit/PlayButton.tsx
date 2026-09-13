import { IconButton } from "./IconButton";
import { Icon } from "./Icon";
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
      aria-label={label || (playing ? "Pause" : "Play")}
      className={cn(
        overlay ? "absolute inset-0 h-full w-full rounded-[inherit]" : className ? undefined : "h-10 w-10",
        className,
      )}
    >
      <Icon name={playing ? "pause" : "play"} size={overlay ? "md" : "sm"} className={playing ? undefined : "translate-x-px"} />
    </IconButton>
  );
}
