"use client";

import { useState } from "react";
import { Button } from "@/kit";

// Nút chép nhanh dùng clipboard, hiển thị trạng thái đã chép
export function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="tap-target shrink-0"
      onClick={() => void onCopy()}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
