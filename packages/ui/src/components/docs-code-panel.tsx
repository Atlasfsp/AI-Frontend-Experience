'use client';

import { useMemo, useState } from 'react';

import { Button } from './button';
import { Card } from './card';

export interface DocsCodeTab {
  content: string;
  id: string;
  kind?: 'code' | 'text';
  label: string;
}

export function DocsCodePanel({
  description,
  tabs,
  title,
}: {
  description?: string;
  tabs: DocsCodeTab[];
  title: string;
}) {
  const initialTab = tabs[0]?.id ?? 'docs';
  const [activeTab, setActiveTab] = useState(initialTab);
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab, tabs],
  );

  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? <p className="text-sm text-slate-300">{description}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            className="rounded-full"
            onClick={() => setActiveTab(tab.id)}
            size="sm"
            variant={tab.id === currentTab?.id ? 'primary' : 'ghost'}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {currentTab ? (
        currentTab.kind === 'code' ? (
          <pre className="overflow-x-auto rounded-[24px] border border-white/10 bg-slate-950/85 p-5 text-xs text-slate-200">
            <code>{currentTab.content}</code>
          </pre>
        ) : (
          <div className="space-y-3 rounded-[24px] border border-white/10 bg-slate-950/35 p-5 text-sm text-slate-300">
            {currentTab.content.split('\n\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )
      ) : null}
    </Card>
  );
}
