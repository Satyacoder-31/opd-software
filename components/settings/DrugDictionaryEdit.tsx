"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import {
  createDrugCatalogItem,
  setDrugCatalogItemActive,
  updateDrugCatalogItem,
} from "@/actions/drug-catalog";
import { DurationField } from "@/components/consultation/DurationField";
import type { DrugDictionaryRow } from "@/components/settings/DrugDictionaryView";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
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

const EMPTY_DEFAULTS = {
  name: "",
  dosage: "",
  route: "Oral",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
};

type DrugDictionaryEditProps = {
  initialItems: DrugDictionaryRow[];
};

export function DrugDictionaryEdit({ initialItems }: DrugDictionaryEditProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<string>();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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
      {error ? <Banner variant="error">{error}</Banner> : null}

      {toggleError ? <Banner variant="error">{toggleError}</Banner> : null}
      {editForm.error ? (
        <Banner variant="error">{editForm.error}</Banner>
      ) : null}

      <ul className="flex flex-col gap-2">
        {items.map((item) => {
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
