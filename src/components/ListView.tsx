/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EducationalNode, NodeType } from '../types';
import { Search, ArrowUpDown, Tag, Clock, BookOpen, ChevronRight, ListFilter, Link as LinkIcon, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { formatTextWithLinks } from '../lib/linkFormatter';

interface ListViewProps {
  nodes: EducationalNode[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
}

type SortOption = 'name-asc' | 'name-desc' | 'year-asc' | 'year-desc';

export default function ListView({ nodes, onSelectNode, selectedNodeId }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Filter & Search handling
  const filteredNodes = nodes.filter((node) => {
    const typeMatch = filterType === 'all' || node.type === filterType;
    const cleanSearchStr = searchTerm.toLowerCase();
    
    const searchMatch =
      node.name.toLowerCase().includes(cleanSearchStr) ||
      node.description.toLowerCase().includes(cleanSearchStr) ||
      node.details.toLowerCase().includes(cleanSearchStr) ||
      node.tags.some((t) => t.toLowerCase().includes(cleanSearchStr));

    return typeMatch && searchMatch;
  });

  // Sorting handling
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'year-asc':
        return a.chronologyVal - b.chronologyVal;
      case 'year-desc':
        return b.chronologyVal - a.chronologyVal;
      default:
        return 0;
    }
  });

  const getBadgeStyle = (type: NodeType) => {
    switch (type) {
      case 'person':
        return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300';
      case 'theory':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'concept':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-300';
      case 'text':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300';
    }
  };

  return (
    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col overflow-hidden transition-colors" id="directory-wrapper">
      {/* List Search Bar + Utility Actions */}
      <div className="max-w-3xl mx-auto w-full mb-6 space-y-4">
        <div>
          <h2 className="font-sans font-bold text-neutral-800 dark:text-neutral-50 text-lg flex items-center gap-1.5 leading-tight select-none">
            <BookOpen className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /> Syllabus Directory
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Search, filter, and index the entire dictionary of scientific learning models.
          </p>
        </div>

        {/* Inputs container */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Query names, tags, detailed analysis notes..."
              className="w-full text-xs font-sans border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white shadow-xs"
            />
          </div>

          {/* Type Filter and Sort select */}
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NodeType | 'all')}
              className="text-xs font-mono border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white cursor-pointer text-neutral-600 dark:text-neutral-300"
            >
              <option value="all">ALL ENTITIES</option>
              <option value="person">PEOPLE ONLY</option>
              <option value="theory">THEORIES ONLY</option>
              <option value="concept">CONCEPTS ONLY</option>
              <option value="text">TEXTS ONLY</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-mono border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer text-neutral-600 dark:text-neutral-300"
            >
              <option value="name-asc">NAME (A &rarr; Z)</option>
              <option value="name-desc">NAME (Z &rarr; A)</option>
              <option value="year-asc">CHRONOLOGY (OLDEST)</option>
              <option value="year-desc">CHRONOLOGY (NEWEST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Scrollable Index layout */}
      <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full space-y-2.5 pr-1 pb-6" id="directory-scroll">
        {sortedNodes.length === 0 ? (
          <div className="w-full text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center">
            <ListFilter className="w-10 h-10 text-neutral-300 dark:text-neutral-700 animate-pulse" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 italic font-normal">
              No matching records found. Refine your query parameters or reset categories.
            </p>
          </div>
        ) : (
          sortedNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`w-full p-4 hover:p-[17px] bg-white dark:bg-neutral-900 border rounded-2xl cursor-pointer text-left transition-all duration-150 flex items-start gap-4 select-none group shadow-xs ${
                  isSelected
                    ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/10'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Visual marker */}
                <div className="flex flex-col items-start justify-between h-full flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold uppercase border px-2 py-0.5 rounded ${getBadgeStyle(node.type)}`}>
                        {node.type}
                      </span>
                      <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-100 text-sm tracking-tight truncate">
                        {node.name}
                      </h3>
                    </div>
                    
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold flex items-center gap-1 self-start sm:self-center bg-neutral-50 dark:bg-neutral-950 px-2 py-0.5 rounded border border-neutral-150 dark:border-neutral-800">
                      <Clock className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" /> {node.chronology}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-550 dark:text-neutral-400 leading-relaxed font-normal mb-3 w-full pr-6 line-clamp-2">
                    {formatTextWithLinks(node.description)}
                  </p>

                  {/* Tags list */}
                  {node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Tag className="w-3 h-3 text-neutral-305" />
                      {node.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-sans font-semibold text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-950 px-2 py-0.2 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right arrow entry indicator */}
                <div className="flex-shrink-0 self-center p-1 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-lg transition text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
