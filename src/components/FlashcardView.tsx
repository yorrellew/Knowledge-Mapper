/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EducationalNode, NodeType } from '../types';
import { ChevronLeft, ChevronRight, RefreshCw, Star, Sparkles, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatTextWithLinks } from '../lib/linkFormatter';

interface FlashcardViewProps {
  nodes: EducationalNode[];
}

export default function FlashcardView({ nodes }: FlashcardViewProps) {
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Track study feedback states in local component memory
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());

  // Filtered nodes
  const filteredNodes = nodes.filter((n) => filterType === 'all' || n.type === filterType);
  const totalCards = filteredNodes.length;
  const currentNode = filteredNodes[currentIndex] || null;

  const handleNext = () => {
    if (totalCards === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
    }, 150);
  };

  const handlePrev = () => {
    if (totalCards === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
    }, 150);
  };

  const handleFilterChange = (type: NodeType | 'all') => {
    setFilterType(type);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Ensure not in review
        const updatedReview = new Set(reviewIds);
        updatedReview.delete(id);
        setReviewIds(updatedReview);
      }
      return next;
    });
  };

  const toggleNeedsReview = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Ensure not in mastered
        const updatedMastered = new Set(masteredIds);
        updatedMastered.delete(id);
        setMasteredIds(updatedMastered);
      }
      return next;
    });
  };

  const getCardHeaderColor = (type: NodeType) => {
    switch (type) {
      case 'person':
        return 'from-indigo-500 to-indigo-600';
      case 'theory':
        return 'from-emerald-500 to-emerald-600';
      case 'concept':
        return 'from-amber-500 to-amber-600';
      case 'text':
        return 'from-rose-500 to-rose-600';
    }
  };

  const getBoxBadgeStyle = (type: NodeType) => {
    switch (type) {
      case 'person':
        return 'bg-indigo-55 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-105 dark:border-indigo-900/50';
      case 'theory':
        return 'bg-emerald-55 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-105 dark:border-emerald-900/50';
      case 'concept':
        return 'bg-amber-55 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-105 dark:border-amber-900/50';
      case 'text':
        return 'bg-rose-55 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-105 dark:border-rose-900/50';
    }
  };

  return (
    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col overflow-y-auto" id="deck-wrapper">
      {/* View Header with Filters */}
      <div className="max-w-xl mx-auto w-full mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-neutral-800 dark:text-neutral-50 text-lg flex items-center gap-1.5 leading-tight select-none">
            <Sparkles className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /> Card Review Engine
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Toggle, flip, and label active study material nodes to verify facts.
          </p>
        </div>

        {/* Filter Pill List */}
        <div className="flex flex-wrap bg-neutral-200/80 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-300 dark:border-neutral-800 w-fit self-start sm:self-center">
          {(['all', 'person', 'theory', 'concept', 'text'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleFilterChange(t)}
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

      {totalCards === 0 ? (
        /* Empty Filter State */
        <div className="flex-1 flex flex-col justify-center items-center text-center self-center max-w-sm">
          <p className="text-sm font-sans text-neutral-500 dark:text-neutral-400 italic mt-4">
            No study items match your active cards filter check. Try selecting "All" or add items on the main map view!
          </p>
        </div>
      ) : (
        /* Active Deck Presentation */
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center gap-6">
          
          {/* Main 3D Card Stage */}
          <div className="relative w-full aspect-[4/3.4] [perspective:1200px]" id="stage-3d">
            <AnimatePresence mode="wait">
              {currentNode && (
                <motion.div
                  key={`${currentNode.id}-${currentIndex}`}
                  initial={{ rotateY: 15, x: 8, opacity: 0 }}
                  animate={{ rotateY: 0, x: 0, opacity: 1 }}
                  exit={{ rotateY: -15, x: -8, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative w-full h-full cursor-pointer select-none [transform-style:preserve-3d]"
                >
                  
                  {/* Outer Flip Wrapper (controlled via state) */}
                  <div
                    className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${
                      isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                  >
                    
                    {/* FRONTSIDE OF FLASHCARD */}
                    <div className="absolute inset-0 w-full h-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-lg p-8 flex flex-col justify-between backface-hidden [backface-visibility:hidden]">
                      {/* Top ribbon info */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] uppercase tracking-wider font-mono font-bold px-2.5 py-0.5 border rounded-full ${getBoxBadgeStyle(currentNode.type)}`}>
                          {currentNode.type}
                        </span>
                        <span className="text-xs font-mono text-neutral-400 dark:text-neutral-505 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-600" /> Click to flip
                        </span>
                      </div>
 
                      {/* Main Center Term Heading */}
                      <div className="text-center py-2 flex-1 flex flex-col justify-center items-center">
                        {currentNode.imageUrl && (
                          <img
                            src={currentNode.imageUrl}
                            alt={currentNode.name}
                            referrerPolicy="no-referrer"
                            className="h-44 w-full max-w-sm object-contain bg-neutral-50/65 dark:bg-neutral-950/65 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-2xs mb-4"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <h3 className="font-sans font-bold text-2xl tracking-tight text-neutral-800 dark:text-neutral-50 leading-snug px-4">
                          {currentNode.name}
                        </h3>
                        <p className="text-xs text-neutral-450 dark:text-neutral-400 font-normal mt-2 px-8 line-clamp-2">
                          {formatTextWithLinks(currentNode.description)}
                        </p>
                      </div>

                      {/* Footer tags / progress */}
                      <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                        <span className="font-mono text-[10px] font-bold">
                          CHRONOLOGY: {currentNode.chronology}
                        </span>
                        <span className="font-medium">
                          {currentIndex + 1} / {totalCards}
                        </span>
                      </div>
                    </div>


                    {/* BACKSIDE OF FLASHCARD */}
                    <div className="absolute inset-0 w-full h-full bg-neutral-900 text-white rounded-3xl border border-neutral-800 shadow-2xl p-8 flex flex-col justify-between [transform:rotateY(180deg)] backface-hidden [backface-visibility:hidden]">
                      
                      {/* Back header with status actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-wider font-mono bg-white/10 text-neutral-305 px-2.5 py-1 rounded-full font-bold">
                          Fact Check
                        </span>
                        
                        <div className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">
                          Flipped State
                        </div>
                      </div>
 
                      {/* Content representation */}
                      <div className="flex-1 overflow-y-auto my-3 space-y-2.5 text-left pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                        <span className="text-[9px] font-mono font-bold text-neutral-500 block uppercase">
                          STUDY NOTES & REFERENCE OUTLINE
                        </span>
                        <p className="text-white font-semibold text-sm leading-snug">
                          {currentNode.name}
                        </p>
                        <p className="text-neutral-300 text-xs leading-relaxed font-normal">
                          {formatTextWithLinks(currentNode.details || currentNode.description)}
                        </p>
                        {currentNode.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {currentNode.tags.map(t => (
                              <span key={t} className="text-[9px] font-sans font-medium px-2 py-0.5 bg-neutral-800 text-neutral-405 rounded-md">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* State Allocation Option Block */}
                      <div className="border-t border-neutral-800 pt-3 pb-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9.5px] font-mono font-bold text-neutral-500 block uppercase tracking-wider mb-2.5 text-center">
                          Allocate Card State
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMasteredIds((prev) => {
                                const next = new Set(prev);
                                next.add(currentNode.id);
                                return next;
                              });
                              setReviewIds((prev) => {
                                const next = new Set(prev);
                                next.delete(currentNode.id);
                                return next;
                              });
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-bold tracking-wide uppercase transition duration-150 cursor-pointer text-center select-none ${
                              masteredIds.has(currentNode.id)
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                                : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                          >
                            ✓ Mastered
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewIds((prev) => {
                                const next = new Set(prev);
                                next.add(currentNode.id);
                                return next;
                              });
                              setMasteredIds((prev) => {
                                const next = new Set(prev);
                                next.delete(currentNode.id);
                                return next;
                              });
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-bold tracking-wide uppercase transition duration-150 cursor-pointer text-center select-none ${
                              reviewIds.has(currentNode.id)
                                ? 'bg-red-500/20 border-red-500 text-red-300 ring-2 ring-red-500/20'
                                : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                          >
                            ⚠ Review
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMasteredIds((prev) => {
                                const next = new Set(prev);
                                next.delete(currentNode.id);
                                return next;
                              });
                              setReviewIds((prev) => {
                                const next = new Set(prev);
                                next.delete(currentNode.id);
                                return next;
                              });
                            }}
                            className={`py-2 rounded-xl border text-[10px] font-bold tracking-wide uppercase transition duration-150 cursor-pointer text-center select-none ${
                              !masteredIds.has(currentNode.id) && !reviewIds.has(currentNode.id)
                                ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                                : 'border-neutral-800 bg-neutral-950/30 text-neutral-450 hover:text-white hover:bg-neutral-800'
                            }`}
                          >
                            Unexamined
                          </button>
                        </div>
                      </div>
 
                      {/* Back index footer */}
                      <div className="text-[10px] font-mono text-neutral-500 flex justify-between border-t border-neutral-800 pt-3">
                        <span>TAP TO FLIP BACK</span>
                        <span>{currentIndex + 1} / {totalCards}</span>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Flip & Navigation Menu */}
          <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-5 py-3 rounded-2xl shadow-sm">
            <button
              onClick={handlePrev}
              type="button"
              className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-1.5 bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer font-sans"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> FLIP
            </button>

            <button
              onClick={handleNext}
              type="button"
              className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Progress tracking panel */}
          <div className="grid grid-cols-3 gap-2 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 text-xs shadow-xs">
            <div className="flex flex-col py-1">
              <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[9px] tracking-wider uppercase">Mastered</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm mt-0.5">{masteredIds.size}</span>
            </div>
            <div className="flex flex-col py-1 border-l border-r border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[9px] tracking-wider uppercase">Needs Review</span>
              <span className="text-red-500 dark:text-red-450 font-bold font-mono text-sm mt-0.5">{reviewIds.size}</span>
            </div>
            <div className="flex flex-col py-1">
              <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[9px] tracking-wider uppercase">Unexamined</span>
              <span className="text-neutral-600 dark:text-neutral-300 font-bold font-mono text-sm mt-0.5">
                {Math.max(0, totalCards - masteredIds.size - reviewIds.size)}
              </span>
            </div>
          </div>

          {/* Reset Progress Action */}
          <div className="flex justify-center mt-1">
            <button
              onClick={() => {
                setMasteredIds(new Set());
                setReviewIds(new Set());
              }}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-450 hover:text-neutral-750 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors cursor-pointer select-none py-1.5 px-3.5 hover:bg-neutral-100/80 dark:hover:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl"
              id="reset-study-stats-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Progress
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
