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
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 p-3">
      <label className="block text-sm font-semibold text-slate-900">Event tags</label>
      <p className="mt-1 text-xs text-slate-600">Type to see existing tags. Press Enter to add a new one.</p>

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
        className="input-shell mt-2"
      />

      {suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAdd(tag)}
              className="stamp-pill rounded-full px-2 py-1 text-xs text-slate-800 transition-colors hover:bg-white"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {selectedTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span key={tag} className="stamp-pill inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-slate-800">
              {tag}
              <button 
                type="button" 
                onClick={() => onRemoveTag(tag)} 
                className="text-slate-500 hover:text-slate-900"
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