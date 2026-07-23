"use client";

import { useState } from "react";

export interface CategoryTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

/**
 * Tab chrome only appears once a second /trends category exists. With a single
 * tab (today: only "Animais"), renders the content directly -- no dead UI.
 */
export function CategoryTabs({ tabs }: { tabs: CategoryTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  if (tabs.length === 0) return null;
  if (tabs.length === 1) return <>{tabs[0].content}</>;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-6 border-b border-line">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={`relative pb-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ${
                isActive ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-charcoal" />}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} hidden={tab.id !== activeId}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
