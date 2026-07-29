"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  faMagnifyingGlass,
  faPills,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  createDrugCatalogItem,
  setDrugCatalogItemActive,
  updateDrugCatalogItem,
} from "@/actions/drug-catalog";
import { DurationField } from "@/components/consultation/DurationField";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import {
  defaultsFromEntry,
  formatDrugDefaultsSummary,
} from "@/lib/drug-catalog";
import {
  FREQUENCY_OPTIONS,
  INSTRUCTION_OPTIONS,
  MEDICINE_ROUTES,
} from "@/lib/prescription-utils";
import { usePendingAction } from "@/hooks/usePendingAction";
import { useServerActionForm } from "@/hooks/useServerActionForm";

export type DrugDictionaryRow = {
  id: string;
  name: string;
  isActive: boolean;
  usageCount: number;
  dosage: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  instructions: string | null;
};

type DrugDictionaryCardProps = {
  initialItems: DrugDictionaryRow[];
};

const EMPTY_DEFAULTS = {
  name: "",
  dosage: "",
  route: "Oral",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
};

export function DrugDictionaryCard({
  initialItems,
}: DrugDictionaryCardProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<string>();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en");
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      item.name.toLocaleLowerCase("en").includes(normalizedQuery)
    );
  }, [items, query]);

  const {
    handleSubmit,
    error,
    fieldError,
    pending,
    values,
    setValue,
    setValues,
  } = useServerActionForm(createDrugCatalogItem, {
    initialValues: EMPTY_DEFAULTS,
    onSuccess: (data) => {
      setValues(EMPTY_DEFAULTS);
      if (data) {
        setItems((current) => {
          const remaining = current.filter((item) => item.id !== data.id);
          return [data, ...remaining];
        });
      }
      router.refresh();
    },
  });

  const editForm = useServerActionForm(updateDrugCatalogItem, {
    onSuccess: (data) => {
      if (data) {
        setItems((current) =>
          current.map((entry) => (entry.id === data.id ? data : entry))
        );
      }
      setEditingId(null);
      router.refresh();
    },
  });

  function handleToggle(item: DrugDictionaryRow) {
    const nextActive = !item.isActive;
    setToggleError(null);
    void run(async () => {
      const result = await setDrugCatalogItemActive(item.id, nextActive);
      if (!result.success) {
        setToggleError(result.error);
        return;
      }
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, isActive: nextActive } : entry
        )
      );
      router.refresh();
    }, item.id);
  }

  function startEdit(item: DrugDictionaryRow) {
    setEditingId(item.id);
    editForm.setValues({
      id: item.id,
      name: item.name,
      dosage: item.dosage ?? "",
      route: item.route ?? "",
      frequency: item.frequency ?? "",
      duration: item.duration ?? "",
      quantity: item.quantity ?? "",
      instructions: item.instructions ?? "",
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Banner variant="info">
        Common medicines include typical dose, route, frequency, and
        instructions. Clinic entries learn from what you prescribe — pick a
        medicine in Rx and those fields fill in automatically.
      </Banner>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 border-b border-border pb-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Add medicine"
              name="name"
              autoComplete="off"
              value={values.name ?? ""}
              onChange={(event) => setValue("name", event.target.value)}
              error={fieldError("name")}
              placeholder="e.g. Paracetamol 250 mg/5 ml suspension"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <Input
              label="Default dose"
              name="dosage"
              value={values.dosage ?? ""}
              onChange={(event) => setValue("dosage", event.target.value)}
              error={fieldError("dosage")}
              placeholder="1 tablet"
            />
            <Select
              label="Default route"
              name="route"
              value={values.route ?? ""}
              onChange={(event) => setValue("route", event.target.value)}
              error={fieldError("route")}
              options={[
                { value: "", label: "—" },
                ...MEDICINE_ROUTES.map((route) => ({
                  value: route,
                  label: route,
                })),
              ]}
            />
          </div>
          <Select
            label="Default frequency"
            name="frequency"
            value={values.frequency ?? ""}
            onChange={(event) => setValue("frequency", event.target.value)}
            error={fieldError("frequency")}
            options={[
              { value: "", label: "—" },
              ...FREQUENCY_OPTIONS.map((frequency) => ({
                value: frequency,
                label: frequency,
              })),
            ]}
          />
          <DurationField
            name="duration"
            label="Default duration"
            value={values.duration ?? ""}
            onChange={(next) => setValue("duration", next)}
          />
          <Input
            label="Default quantity"
            name="quantity"
            value={values.quantity ?? ""}
            onChange={(event) => setValue("quantity", event.target.value)}
            error={fieldError("quantity")}
            placeholder="Optional"
          />
          <Select
            label="Default instructions"
            name="instructions"
            value={values.instructions ?? ""}
            onChange={(event) => setValue("instructions", event.target.value)}
            error={fieldError("instructions")}
            options={[
              { value: "", label: "—" },
              ...INSTRUCTION_OPTIONS.map((instruction) => ({
                value: instruction,
                label: instruction,
              })),
            ]}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            <Icon icon={faPlus} data-icon="inline-start" />
            Add to dictionary
          </Button>
        </div>
      </form>
      {error && <Banner variant="error">{error}</Banner>}

      <SearchField
        label="Find clinic medicines"
        name="medicine-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or strength"
      />

      {toggleError && <Banner variant="error">{toggleError}</Banner>}
      {editForm.error && <Banner variant="error">{editForm.error}</Banner>}

      <ul className="flex flex-col gap-2">
        {filteredItems.length === 0 && (
          <li>
            <EmptyState
              icon={query ? faMagnifyingGlass : faPills}
              title={query ? "No matching medicines" : "No clinic medicines yet"}
              description={
                query
                  ? "Try another name or strength."
                  : "Add one above, or save a prescription to build the clinic dictionary."
              }
              compact
            />
          </li>
        )}
        {filteredItems.map((item) => {
          const summary = formatDrugDefaultsSummary(defaultsFromEntry(item));
          const isEditing = editingId === item.id;

          return (
            <li
              key={item.id}
              className="rounded-lg border border-border px-3 py-2"
            >
              {isEditing ? (
                <form
                  onSubmit={editForm.handleSubmit}
                  className="flex flex-col gap-3"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        label="Medicine"
                        name="name"
                        value={editForm.values.name ?? ""}
                        onChange={(event) =>
                          editForm.setValue("name", event.target.value)
                        }
                        error={editForm.fieldError("name")}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                      <Input
                        label="Dose"
                        name="dosage"
                        value={editForm.values.dosage ?? ""}
                        onChange={(event) =>
                          editForm.setValue("dosage", event.target.value)
                        }
                      />
                      <Select
                        label="Route"
                        name="route"
                        value={editForm.values.route ?? ""}
                        onChange={(event) =>
                          editForm.setValue("route", event.target.value)
                        }
                        options={[
                          { value: "", label: "—" },
                          ...MEDICINE_ROUTES.map((route) => ({
                            value: route,
                            label: route,
                          })),
                        ]}
                      />
                    </div>
                    <Select
                      label="Frequency"
                      name="frequency"
                      value={editForm.values.frequency ?? ""}
                      onChange={(event) =>
                        editForm.setValue("frequency", event.target.value)
                      }
                      options={[
                        { value: "", label: "—" },
                        ...FREQUENCY_OPTIONS.map((frequency) => ({
                          value: frequency,
                          label: frequency,
                        })),
                      ]}
                    />
                    <DurationField
                      name="duration"
                      value={editForm.values.duration ?? ""}
                      onChange={(next) => editForm.setValue("duration", next)}
                    />
                    <Input
                      label="Quantity"
                      name="quantity"
                      value={editForm.values.quantity ?? ""}
                      onChange={(event) =>
                        editForm.setValue("quantity", event.target.value)
                      }
                    />
                    <Select
                      label="Instructions"
                      name="instructions"
                      value={editForm.values.instructions ?? ""}
                      onChange={(event) =>
                        editForm.setValue("instructions", event.target.value)
                      }
                      options={[
                        { value: "", label: "—" },
                        ...INSTRUCTION_OPTIONS.map((instruction) => ({
                          value: instruction,
                          label: instruction,
                        })),
                      ]}
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" loading={editForm.pending}>
                      Save defaults
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="wrap-break-word text-sm font-medium text-ink">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.usageCount === 1
                        ? "Used once"
                        : `Used ${item.usageCount} times`}
                      {!item.isActive ? " · inactive" : ""}
                    </p>
                    {summary ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {summary}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        No defaults yet — edit or prescribe once to learn them.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={isPending(item.id)}
                      onClick={() => handleToggle(item)}
                    >
                      {item.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
