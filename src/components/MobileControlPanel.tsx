import React, { useState } from 'react';

const TABS = [
  { key: 'contour', label: 'Contour' },
  { key: 'filter', label: 'Filter' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'display', label: 'Display' },
] as const;

type TabKey = typeof TABS[number]['key'];

interface MobileControlPanelProps {
  contourContent: React.ReactNode;
  filterContent: React.ReactNode;
  frequencyContent: React.ReactNode;
  displayContent: React.ReactNode;
}

export const MobileControlPanel: React.FC<MobileControlPanelProps> = ({
  contourContent,
  filterContent,
  frequencyContent,
  displayContent,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  const handleTabClick = (key: TabKey) => {
    setActiveTab(prev => (prev === key ? null : key));
  };

  const contentMap: Record<TabKey, React.ReactNode> = {
    contour: contourContent,
    filter: filterContent,
    frequency: frequencyContent,
    display: displayContent,
  };

  return (
    <div className="bg-white border-t border-gray-100 flex-shrink-0">
      {activeTab !== null && (
        <div className="h-[40dvh] overflow-y-auto border-b border-gray-100">
          {contentMap[activeTab]}
        </div>
      )}
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`flex-1 py-3 text-xs font-medium transition-colors duration-200 ${
              activeTab === tab.key
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
