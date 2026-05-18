"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
  wrapperClassName?: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { value, onClear, className, wrapperClassName, ...props },
    ref
  ) {
    const hasValue = typeof value === "string" ? value.length > 0 : !!value;

    return (
      <div className={wrapperClassName ?? "relative w-full"}>
        <input
          ref={ref}
          className={className ?? "input-field w-full px-3 py-2 pr-8"}
          type="text"
          value={value}
          {...props}
        />
        {hasValue && onClear ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
            onClick={onClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            ×
          </button>
        ) : null}
      </div>
    );
  }
);
