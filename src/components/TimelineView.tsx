/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EducationalNode, NodeType } from '../types';
import { Calendar, Clock, Sparkles, Sliders, ChevronDown, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { formatTextWithLinks } from '../lib/linkFormatter';

interface TimelineViewProps {
  nodes: EducationalNode[];
  onSelectNode: (nodeId: string) => void;
  activeNodeId: string | null;
}

export default function TimelineView({ nodes, onSelectNode, activeNodeId }: TimelineViewProps) {
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');

  // Sorted nodes by numerical chronological value
  const sortedNodes = [...nodes]
    .filter((n) => filterType === 'all' || n.type === filterType)
    .sort((a, b) => a.chronologyVal - b.chronologyVal);

  const getTypeStyle = (type: NodeType) => {
    switch (type) {
      case 'person':
        return {
          color: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-500 dark:border-indigo-450',
          bg: 'bg-indigo-50 dark:bg-indigo-950/50',
          span: 'indigo',
        };
      case 'theory':
        return {
          color: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500 dark:border-emerald-450',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          span: 'emerald',
        };
      case 'concept':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500 dark:border-amber-450',
          bg: 'bg-amber-50 dark:bg-amber-950/50',
          span: 'amber',
        };
      case 'text':
        return {
          color: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500 dark:border-rose-450',
          bg: 'bg-rose-50 dark:bg-rose-950/50',
          span: 'rose',
        };
    }
  };

  return (
    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col overflow-y-auto transition-colors" id="timeline-wrapper">
      {/* Timeline Header Info */}
      <div className="max-w-2xl mx-auto w-full mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="font-sans font-bold text-neutral-800 dark:text-neutral-50 text-lg flex items-center gap-1.5 leading-tight">
            <Calendar className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /> Chronology Track
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Browse scholastic records and developmental theoretical progression in order.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap bg-neutral-200/80 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-300 dark:border-neutral-800 w-fit self-start sm:self-center">
          {(['all', 'person', 'theory', 'concept', 'text'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wider uppercase select-none cursor-pointer transition ${
                filterType === t
                  ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {sortedNodes.length === 0 ? (
        <div className="max-w-sm mx-auto flex-1 flex flex-col justify-center items-center text-center">
          <Clock className="w-10 h-10 text-neutral-300 dark:text-neutral-700 animate-pulse" />
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 italic">
            No chronological metadata matches this filter context.
          </p>
        </div>
      ) : (
        /* The Vertical Track */
        <div className="max-w-2xl mx-auto w-full relative flex-1">
          {/* Central spine line */}
          <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-0.5 bg-neutral-200 dark:bg-neutral-800" />

          {/* Timeline Node List */}
          <div className="space-y-8 relative">
            {sortedNodes.map((node, index) => {
              const styleSet = getTypeStyle(node.type);
              const isEven = index % 2 === 0;
              const isActive = activeNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`flex flex-col sm:flex-row items-stretch relative cursor-pointer group ${
                    isEven ? 'sm:flex-row-reverse' : ''
                  }`}
                >
                  
                  {/* Central Spine Node Pin Indicator */}
                  <div className="absolute left-4 sm:left-1/2 -translate-x-[7px] w-[15px] h-[15px] rounded-full bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 group-hover:border-neutral-900 dark:group-hover:border-neutral-100 group-hover:scale-110 flex items-center justify-center transition-all z-10 top-6">
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-neutral-900 dark:bg-white scale-125' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                  </div>

                  {/* Left Side spacer or content (for alignment) */}
                  <div className="w-full sm:w-1/2" />

                  {/* Right Side card or dynamic alignment content */}
                  <div className={`w-full sm:w-1/2 pl-12 sm:pl-0 ${isEven ? 'sm:pr-10 text-left sm:text-right' : 'sm:pl-10 text-left'}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className={`inline-block w-full bg-white dark:bg-neutral-900 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 text-left ${
                        isActive ? 'border-neutral-850 dark:border-neutral-100 ring-1 ring-neutral-805/25 dark:ring-white/20' : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {/* Badge / Year label */}
                      <div className={`flex items-center gap-1.5 ${isEven ? 'sm:justify-end text-left sm:text-right' : ''} text-xs font-mono font-bold ${styleSet.color}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{node.chronology}</span>
                        <span className="text-[10px] uppercase tracking-wider font-mono bg-neutral-100 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.2 rounded scale-90">
                          {node.type}
                        </span>
                      </div>

                      {/* Name heading */}
                      <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-100 text-sm mt-2">
                        {node.name}
                      </h3>

                      {/* Brief overview */}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 lines-2 leading-relaxed">
                        {formatTextWithLinks(node.description)}
                      </p>

                      {/* Hover action guide */}
                      <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-3 block group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition">
                        Select Node to inspect &rarr;
                      </span>
                    </motion.div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
