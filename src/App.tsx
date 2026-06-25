/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_NODES, INITIAL_RELATIONS } from './initialData';
import { EducationalNode, NodeRelation } from './types';
import NetworkGraph from './components/NetworkGraph';
import SidebarDetails from './components/SidebarDetails';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import TimelineView from './components/TimelineView';
import ListView from './components/ListView';
import SheetExportModal from './components/SheetExportModal';
import { Map, Layers, HelpCircle, List, Calendar, FileSpreadsheet, BrainCircuit, Share2, Lock, Sun, Moon, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import lzString from 'lz-string';

type TabType = 'canvas' | 'flashcards' | 'quiz' | 'list' | 'timeline';

export default function App() {
  // Primary state: educational nodes & relations
  const [nodes, setNodes] = useState<EducationalNode[]>(() => {
    const saved = localStorage.getItem('educational_nodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing nodes, loading initial dataset:', e);
      }
    }
    return INITIAL_NODES;
  });

  const [relations, setRelations] = useState<NodeRelation[]>(() => {
    const saved = localStorage.getItem('educational_relations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing relations, loading initial links dataset:', e);
      }
    }
    return INITIAL_RELATIONS;
  });

  // UI state: current selected tab
  const [activeTab, setActiveTab] = useState<TabType>('canvas');
  // Selected node for inspection sidebar
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Sheet Export modal
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  // Read-only share link features
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  // Dark / Night mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('is_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('is_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Check URL queries on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') === 'true' || params.get('readonly') === 'true') {
      setIsReadOnly(true);
    }
    
    // Read from hash if exists, otherwise fallback to query param
    let dataStr = window.location.hash.substring(1);
    // If it's empty, try query parameters
    if (!dataStr) {
      dataStr = params.get('data') || '';
    }
    
    if (dataStr) {
      try {
        let decodedStr: string | null = null;
        try {
          decodedStr = lzString.decompressFromEncodedURIComponent(dataStr);
        } catch (e) {
          // Ignore
        }
        
        if (!decodedStr) {
          decodedStr = decodeURIComponent(atob(dataStr));
        }

        const parsed = JSON.parse(decodedStr);
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.relations) setRelations(parsed.relations);
      } catch (e) {
        console.error('Failed to parse shared data/hash:', e);
      }
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('educational_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('educational_relations', JSON.stringify(relations));
  }, [relations]);

  // Node adjustment handlers
  const handleUpdateNodesList = (updatedList: EducationalNode[]) => {
    if (isReadOnly) return;
    setNodes(updatedList);
  };

  const handleUpdateSingleNode = (updatedNode: EducationalNode) => {
    if (isReadOnly) return;
    setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const handleAddNode = (newNode: EducationalNode) => {
    if (isReadOnly) return;
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id); // focus newly added node
  };

  const handleAddRelation = (newRel: NodeRelation) => {
    if (isReadOnly) return;
    setRelations((prev) => [...prev, newRel]);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (isReadOnly) return;
    // 1. Remove node
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    // 2. Remove any associated link relationships
    setRelations((prev) => prev.filter((r) => r.sourceId !== nodeId && r.targetId !== nodeId));

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleDeleteRelation = (relationId: string) => {
    if (isReadOnly) return;
    setRelations((prev) => prev.filter((r) => r.id !== relationId));
  };

  // Jump to detail tab and select node
  const handleSelectNodeAndFocus = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setActiveTab('canvas'); // Focus on canvas view
  };

  const handleCopyShareLink = () => {
    let hashParam = '';
    try {
      const stateObj = { nodes, relations };
      // Compress state
      const compressedStr = lzString.compressToEncodedURIComponent(JSON.stringify(stateObj));
      hashParam = `#${compressedStr}`;
    } catch(e) {
      console.error('State too large to encode', e);
    }
    const generatedUrl = `${window.location.origin}${window.location.pathname}?shared=true${hashParam}`;
    setShareUrl(generatedUrl);
    setIsShareModalOpen(true);
  };

  const handleImportNodesAndRelations = (importedNodes: EducationalNode[], importedRelations: NodeRelation[]) => {
    if (isReadOnly) return;
    setNodes(importedNodes);
    setRelations(importedRelations);
    setSelectedNodeId(null);
  };

  return (
    <div className="w-full h-screen max-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col font-sans text-neutral-800 dark:text-neutral-100 antialiased overflow-hidden transition-colors duration-200" id="main-applet">
      
      {/* ⚠️ SYSTEM HEADER BAR */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none flex-shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl flex items-center justify-center shadow-md">
            <BrainCircuit className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-neutral-900 dark:text-neutral-50 text-lg sm:text-xl tracking-tight leading-none flex items-center gap-2">
              Knowledge Mapper
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal mt-1 leading-none">
              Interactive relationship designer, flashcards, diagnostic assessments and timeline progressive analysis.
            </p>
          </div>
        </div>

        {/* Action Controls for general utility */}
        <div className="flex items-center gap-2">
          {/* Night Mode Toggle Switch */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
            className="p-2.5 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {isReadOnly ? (
            <>
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50 font-semibold text-[11px] sm:text-xs px-3 py-2 rounded-xl uppercase tracking-wider select-none">
                <Lock className="w-3.5 h-3.5 text-rose-500" /> View-Only Shared Mode
              </div>
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-bold text-[11px] sm:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Download CSV
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-bold text-[11px] sm:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-xs transition"
              >
                <Share2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{shareStatus === 'copied' ? 'Copied Link!' : 'Get Share Link'}</span>
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                id="btn-trigger-sheets-export"
                className="flex items-center gap-1.5 bg-neutral-900 dark:bg-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-900 border border-neutral-800 dark:border-neutral-700 text-white font-semibold text-[11px] sm:text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Bulk Import / Export
              </button>
            </>
          )}
        </div>
      </header>

      {/* VIEW BUTTONS TABS RAIL */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-2 flex gap-1 select-none overflow-x-auto flex-shrink-0 transition-colors duration-200" id="tabs-rail">
        {[
          { id: 'canvas', label: 'Concept Map', icon: Map },
          { id: 'flashcards', label: 'Flashcards Mode', icon: Layers },
          { id: 'quiz', label: 'Quiz Interface', icon: HelpCircle },
          { id: 'list', label: 'Syllabus Index', icon: List },
          { id: 'timeline', label: 'Chronology Timeline', icon: Calendar },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              id={`tab-${tab.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 font-bold border border-neutral-200 dark:border-neutral-700 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent'
              }`}
            >
              <IconComponent className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* CORE DISPLAY WINDOW (Dynamic Switchboards) */}
      <main className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
        
        {activeTab === 'canvas' && (
          <>
            {/* The Interactive Visual Mapping Canvas */}
            <div className="flex-1 h-full relative overflow-hidden bg-neutral-100">
              <NetworkGraph
                nodes={nodes}
                relations={relations}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onUpdateNodes={handleUpdateNodesList}
                onAddNode={handleAddNode}
                onAddRelation={handleAddRelation}
                onDeleteNode={handleDeleteNode}
                onDeleteRelation={handleDeleteRelation}
                isReadOnly={isReadOnly}
              />
            </div>

            {/* Split Screen Panel logic */}
            <AnimatePresence>
              {selectedNodeId && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="w-full md:w-1/2 h-2/3 md:h-full flex-shrink-0 relative border-t md:border-t-0 md:border-l border-neutral-200 shadow-2xl z-20 bg-white"
                >
                  <SidebarDetails
                    selectedNodeId={selectedNodeId}
                    nodes={nodes}
                    relations={relations}
                    onSelectNode={setSelectedNodeId}
                    onUpdateNode={handleUpdateSingleNode}
                    onDeleteNode={handleDeleteNode}
                    onDeleteRelation={handleDeleteRelation}
                    isReadOnly={isReadOnly}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Study view: Flashcards Mode */}
        {activeTab === 'flashcards' && (
          <div className="flex-1 w-full h-full relative" id="flashcards-render">
            <FlashcardView nodes={nodes} />
          </div>
        )}

        {/* Study view: Dynamic Quiz Mode */}
        {activeTab === 'quiz' && (
          <div className="flex-1 w-full h-full relative" id="assignments-render">
            <QuizView nodes={nodes} relations={relations} />
          </div>
        )}

        {/* View list directory index catalog */}
        {activeTab === 'list' && (
          <div className="flex-1 w-full h-full relative" id="list-directory-render">
            <ListView
              nodes={nodes}
              onSelectNode={handleSelectNodeAndFocus}
              selectedNodeId={selectedNodeId}
            />
          </div>
        )}

        {/* View timeline chronological progress maps */}
        {activeTab === 'timeline' && (
          <div className="flex-1 w-full h-full relative" id="timeline-chronology-render">
            <TimelineView
              nodes={nodes}
              onSelectNode={handleSelectNodeAndFocus}
              activeNodeId={selectedNodeId}
            />
          </div>
        )}

      </main>

      {/* SYSTEM SHEETS EXPORT MODAL WIZARD */}
      <AnimatePresence>
        {isExportOpen && (
          <SheetExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            nodes={nodes}
            relations={relations}
            onImportNodesAndRelations={handleImportNodesAndRelations}
            isReadOnly={isReadOnly}
          />
        )}
      </AnimatePresence>

      {/* SHARE / EMBED MODAL WIZARD */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-105 transition-colors duration-200"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-6">
                <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-50 text-base flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-500" /> Share & Embed
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">Direct Read-Only Link</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={shareUrl} className="flex-1 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 focus:outline-none select-all font-mono" />
                    <button onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setShareStatus('copied');
                        setTimeout(() => setShareStatus('idle'), 2500);
                      }}
                      className="bg-neutral-900 dark:bg-neutral-800 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-neutral-800 dark:hover:bg-neutral-700 transition font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5" /> {shareStatus === 'copied' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">HTML Embed Code (For Websites & Google Sites)</label>
                  <div className="flex gap-2 items-start">
                    <textarea readOnly value={`<iframe src="${shareUrl}" width="100%" height="800px" style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`} rows={3} className="flex-1 text-[10px] sm:text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 focus:outline-none select-all font-mono resize-none leading-relaxed"></textarea>
                    <button onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${shareUrl}" width="100%" height="800px" style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`);
                      }}
                      className="bg-neutral-900 dark:bg-neutral-800 text-white px-3 py-6 flex flex-col justify-center items-center rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-700 transition h-auto shrink-0 font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[9px] uppercase tracking-wider">Code</span>
                    </button>
                  </div>
                  <div className="text-[10.5px] text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed space-y-2">
                    <p><strong>Deploy in HTML:</strong> This project is built as a single-page app. You can deploy it purely as static HTML by hosting it on platforms like GitHub Pages, Vercel, or Netlify, simply point them to the repository, or build the static <code>dist/</code> folder.</p>
                    <p><strong>Embed in Google Sites:</strong></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>In your Google Site, open the page where you want the visualization.</li>
                      <li>In the right panel, click the <strong>Embed</strong> button (&lt;&gt; icon).</li>
                      <li>Choose the <strong>Embed code</strong> tab.</li>
                      <li>Paste the HTML iframe code exactly as copied from above.</li>
                      <li>Click <strong>Next</strong> and then <strong>Insert</strong>. Adjust the widget size as needed!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
