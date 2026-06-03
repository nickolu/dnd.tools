type ReRollButtonProps = {
  onClick: () => void;
  label?: string;
};

export function ReRollButton({
  onClick,
  label = "Re-roll",
}: ReRollButtonProps) {
  return (
    <button
      className="no-print inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-muted opacity-60 transition-opacity hover:opacity-100 hover:bg-white/10"
      onClick={onClick}
      title={label}
      type="button"
    >
      &#x21bb;
    </button>
  );
}
