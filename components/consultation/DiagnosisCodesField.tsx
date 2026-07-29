"use client";

import { useMemo, useState } from "react";
import { searchIcdCodes, type DiagnosisCodeEntry } from "@/lib/icd-catalog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/shadcn/badge";

type DiagnosisCodesFieldProps = {
  value: DiagnosisCodeEntry[];
  onChange: (codes: DiagnosisCodeEntry[]) => void;
};

export function DiagnosisCodesField({
  value,
  onChange,
}: DiagnosisCodesFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => searchIcdCodes(query, 10), [query]);

  function addCode(code: string, display: string) {
    if (value.some((item) => item.code === code)) return;
    const type = value.length === 0 ? "primary" : "secondary";
    onChange([...value, { code, display, type }]);
    setQuery("");
    setOpen(false);
  }

  function removeCode(code: string) {
    const next = value.filter((item) => item.code !== code);
    if (next.length > 0 && !next.some((item) => item.type === "primary")) {
      next[0] = { ...next[0], type: "primary" };
    }
    onChange(next);
  }

  function setPrimary(code: string) {
    onChange(
      value.map((item) => ({
        ...item,
        type: item.code === code ? "primary" : "secondary",
      }))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          label="ICD-10 diagnosis"
          name="icdSearch"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search code or condition…"
          autoComplete="off"
        />
        {open && suggestions.length > 0 ? (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-white shadow-md"
            role="listbox"
          >
            {suggestions.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-surface"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addCode(item.code, item.display)}
                >
                  <span className="font-medium text-ink">{item.code}</span>
                  <span className="text-muted-foreground">{item.display}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {value.map((item) => (
            <li
              key={item.code}
              className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{item.code}</span>
                  <Badge variant={item.type === "primary" ? "default" : "secondary"}>
                    {item.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.display}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {item.type !== "primary" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPrimary(item.code)}
                  >
                    Primary
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCode(item.code)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
