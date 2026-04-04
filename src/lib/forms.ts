export function getTrimmedField(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

export function parseStringList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeStringList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
