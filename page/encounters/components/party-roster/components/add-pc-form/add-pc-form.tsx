"use client";

import { type FormEvent, useState } from "react";

import { DEFAULT_PC_LEVEL } from "@/page/encounters/constants";

type Props = {
  onAdd: (name: string, level: number) => void;
};

export function AddPcForm({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number>(DEFAULT_PC_LEVEL);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, level);
    setName("");
    setLevel(DEFAULT_PC_LEVEL);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-1 flex-col gap-1">
        <span className="typography-kicker text-muted">Name</span>
        <input
          className="input-field typography-body-sm px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aragorn"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="typography-kicker text-muted">Level</span>
        <select
          className="input-field typography-body-sm px-2 py-1"
          value={level}
          onChange={(e) => setLevel(Number.parseInt(e.target.value, 10))}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="admin-button typography-body-sm px-3 py-1"
        disabled={!name.trim()}
      >
        Add PC
      </button>
    </form>
  );
}
