"use client";

import { useMemo, useState } from "react";

type TagSelectorProps = {
  existingTags: string[];
};

function normalizeTag(value: string) {
  return value.trim();
}

export default function TagSelector({ existingTags }: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return existingTags
      .filter((tag) => !selectedTags.includes(tag) && tag.toLowerCase().includes(query))
      .slice(0, 5);
  }, [existingTags, inputValue, selectedTags]);

  const addTag = (rawTag: string) => {
    const tag = normalizeTag(rawTag);
    if (!tag) {
      return;
    }

    if (selectedTags.some((selected) => selected.toLowerCase() === tag.toLowerCase())) {
      setInputValue("");
      return;
    }

    setSelectedTags((previous) => [...previous, tag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((previous) => previous.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="rounded-md border border-gray-300 p-3">
      <label className="block text-sm font-medium text-gray-900">Event tags</label>
      <p className="mt-1 text-xs text-gray-600">Type to see existing tags. Press Enter to add a new one.</p>

      <input
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTag(inputValue);
          }
        }}
        placeholder="Add tag"
        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      {suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-800"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {selectedTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-gray-600">
                x
              </button>
              <input type="hidden" name="eventTags" value={tag} />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
