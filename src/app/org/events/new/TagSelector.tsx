"use client";

import { useMemo, useState } from "react";

type TagSelectorProps = {
  existingTags: string[];
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
};

function normalizeTag(value: string) {
  return value.trim();
}

export default function TagSelector({ existingTags, selectedTags, onAddTag, onRemoveTag }: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("");

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return existingTags
      .filter((tag) => !selectedTags.includes(tag) && tag.toLowerCase().includes(query))
      .slice(0, 5);
  }, [existingTags, inputValue, selectedTags]);

  const handleAdd = (rawTag: string) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;
    
    onAddTag(tag);
    setInputValue("");
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
            handleAdd(inputValue);
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
              onClick={() => handleAdd(tag)}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-800 transition-colors hover:bg-gray-50"
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
              <button 
                type="button" 
                onClick={() => onRemoveTag(tag)} 
                className="text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
              <input type="hidden" name="eventTags" value={tag} />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}