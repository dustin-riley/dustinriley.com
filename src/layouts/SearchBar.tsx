import React, { useEffect, useRef, useState } from "react";
import Fuse from "fuse.js";

export type SearchItem = {
  slug: string;
  data: any;
  content: any;
};

interface Props {
  searchList: SearchItem[];
}

interface SearchResult {
  item: SearchItem;
  refIndex: number;
}

const monthName = (d: Date | string | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const readMinutes = (content: string | undefined) => {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  return `${mins} min`;
};

export default function SearchBar({ searchList }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );

  const fuse = new Fuse(searchList, {
    keys: ["data.title", "data.description", "data.categories", "data.tags", "content"],
    includeMatches: true,
    minMatchCharLength: 2,
    threshold: 0.4,
  });

  useEffect(() => {
    const searchUrl = new URLSearchParams(window.location.search);
    const searchStr = searchUrl.get("q");
    if (searchStr) setInputVal(searchStr);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd =
          searchStr?.length || 0;
      }
    }, 50);
  }, []);

  useEffect(() => {
    const results = inputVal.length > 1 ? fuse.search(inputVal) : [];
    setSearchResults(results);

    if (inputVal.length > 0) {
      const params = new URLSearchParams(window.location.search);
      params.set("q", inputVal);
      history.pushState(null, "", window.location.pathname + "?" + params.toString());
    } else {
      history.pushState(null, "", window.location.pathname);
    }
  }, [inputVal]);

  const count = searchResults?.length ?? 0;

  return (
    <div>
      <input
        className="ds-search-input"
        placeholder="type to search posts…"
        type="text"
        name="search"
        value={inputVal}
        onChange={(e) => setInputVal(e.currentTarget.value)}
        autoComplete="off"
        autoFocus
        ref={inputRef}
      />

      {inputVal.length > 1 && (
        <p
          className="ds-search-meta"
          style={{
            fontFamily: "var(--ds-font-mono)",
            fontSize: 12,
            color: "var(--ds-text-muted)",
            marginTop: "var(--ds-space-4)",
          }}
        >
          {count} {count === 1 ? "result" : "results"} for "{inputVal}"
        </p>
      )}

      {count > 0 && (
        <ul className="writing-list" style={{ marginTop: "var(--ds-space-4)" }}>
          {searchResults!.map(({ item }) => (
            <li key={item.slug}>
              <a className="writing-item" href={`/${item.slug}`}>
                <span className="date">{monthName(item.data.date)}</span>
                <span className="title">{item.data.title}</span>
                <span className="read-time">{readMinutes(item.content)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {inputVal.length > 1 && count === 0 && (
        <p
          className="ds-lede"
          style={{ marginTop: "var(--ds-space-5)", color: "var(--ds-text-muted)" }}
        >
          Nothing matched. Try a shorter or different query.
        </p>
      )}
    </div>
  );
}
