/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EducationalNode, NodeRelation, NodeType } from '../types';
import { X, Trash2, Edit2, Check, ArrowRight, CornerDownRight, Tag, BookOpen, Clock, Calendar, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { formatTextWithLinks } from '../lib/linkFormatter';

interface SidebarDetailsProps {
  selectedNodeId: string | null;
  nodes: EducationalNode[];
  relations: NodeRelation[];
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNode: (node: EducationalNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteRelation?: (relationId: string) => void;
  isReadOnly?: boolean;
}

export default function SidebarDetails({
  selectedNodeId,
  nodes,
  relations,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onDeleteRelation,
  isReadOnly = false,
}: SidebarDetailsProps) {
  const node = nodes.find((n) => n.id === selectedNodeId);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  const [editedDesc, setEditedDesc] = useState<string>('');
  const [editedDetails, setEditedDetails] = useState<string>('');
  const [editedChron, setEditedChron] = useState<string>('');
  const [editedTags, setEditedTags] = useState<string>('');
  const [editedImageUrl, setEditedImageUrl] = useState<string>('');
  const [editedNationality, setEditedNationality] = useState<string>('');
  const [editedType, setEditedType] = useState<NodeType>('concept');
  
  // Specific Text Entity Fields
  const [editedAuthor, setEditedAuthor] = useState<string>('');
  const [editedAbstract, setEditedAbstract] = useState<string>('');
  const [editedOriginalLanguage, setEditedOriginalLanguage] = useState<string>('');
  const [editedPdfUrl, setEditedPdfUrl] = useState<string>('');
  const [editedAltTitles, setEditedAltTitles] = useState<string>('');
  const [editedImageCaption, setEditedImageCaption] = useState<string>('');

  // Closer look zoom state
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [relationConfirmId, setRelationConfirmId] = useState<string | null>(null);

  // Sync state with selected node change
  useEffect(() => {
    if (node) {
      setEditedName(node.name);
      setEditedDesc(node.description);
      setEditedDetails(node.details);
      setEditedChron(node.chronology);
      setEditedTags(node.tags.join(', '));
      setEditedImageUrl(node.imageUrl || '');
      setEditedNationality(node.nationality || '');
      setEditedType(node.type);
      setEditedAuthor(node.author || '');
      setEditedAbstract(node.abstract || '');
      setEditedOriginalLanguage(node.originalLanguage || '');
      setEditedPdfUrl(node.pdfUrl || '');
      setEditedAltTitles(node.altTitles || '');
      setEditedImageCaption(node.imageCaption || '');
      setIsEditing(false); // Reset to view mode on selection change
      setIsImageZoomed(false); // Reset zoom
      setShowDeleteConfirm(false);
      setRelationConfirmId(null);
    }
  }, [selectedNodeId, node]);

  if (!node) {
    return (
      <div className="w-full h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-center items-center text-center transition-colors">
        <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-600 mb-4 animate-pulse">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="font-sans font-semibold text-neutral-800 dark:text-neutral-200 text-sm tracking-tight">Study Panel</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mt-2 leading-relaxed">
          Select any investigator, educational theory, or core concept on the canvas to inspect learning stages, chronological contexts, and visual relationships.
        </p>
      </div>
    );
  }

  // Find associated relations
  const nodeRelations = relations.filter(
    (r) => r.sourceId === node.id || r.targetId === node.id
  );

  const handleSave = () => {
    if (!editedName.trim()) return;

    const parsedChronVal = parseInt(editedChron.split('-')[0]) || node.chronologyVal;

    const updatedNode: EducationalNode = {
      ...node,
      type: editedType,
      name: editedName,
      description: editedDesc,
      details: editedDetails,
      chronology: editedChron,
      chronologyVal: parsedChronVal,
      tags: editedTags.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: editedImageUrl.trim() || undefined,
      nationality: editedType === 'person' ? (editedNationality.trim() || undefined) : undefined,
      author: editedType === 'text' ? (editedAuthor.trim() || undefined) : undefined,
      abstract: editedType === 'text' ? (editedAbstract.trim() || undefined) : undefined,
      originalLanguage: editedType === 'text' ? (editedOriginalLanguage.trim() || undefined) : undefined,
      pdfUrl: editedType === 'text' ? (editedPdfUrl.trim() || undefined) : undefined,
      altTitles: editedType === 'text' ? (editedAltTitles.trim() || undefined) : undefined,
      imageCaption: editedImageCaption.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onUpdateNode(updatedNode);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    onDeleteNode(node.id);
    onSelectNode(null);
    setShowDeleteConfirm(false);
  };

  const getBadgeStyle = (type: NodeType) => {
    switch (type) {
      case 'person':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300';
      case 'theory':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300';
      case 'concept':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300';
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden transition-colors" id="details-pane">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full font-bold ${getBadgeStyle(node.type)}`}>
            {node.type}
          </span>
          <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" /> {node.chronology}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!isReadOnly && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-emerald-600 dark:text-emerald-450 transition cursor-pointer"
                  title="Save changes"
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 transition cursor-pointer"
                  title="Edit info"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  showDeleteConfirm 
                    ? "bg-rose-600 hover:bg-rose-700 text-white px-2 py-1.5 text-xs font-semibold animate-pulse" 
                    : "hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-600 dark:text-rose-450"
                }`}
                title={showDeleteConfirm ? "Click again to confirm delete" : "Delete node"}
              >
                <Trash2 className="w-4 h-4" />
                {showDeleteConfirm && <span className="font-sans text-[11px]">Confirm?</span>}
              </button>
              {showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1.5 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400 transition cursor-pointer font-sans"
                >
                  Cancel
                </button>
              )}
            </>
          )}
          <button
            onClick={() => onSelectNode(null)}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition cursor-pointer"
            title="Close panel"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main Panel Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isEditing ? (
          /* EDITING MODULE */
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1.5">CLASSIFICATION / DESIGNATION</label>
              <div className="grid grid-cols-4 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 gap-1">
                {(['person', 'theory', 'concept', 'text'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditedType(t)}
                    className={`py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition select-none cursor-pointer text-center ${
                      editedType === t
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200/50 dark:border-neutral-700'
                        : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 bg-transparent'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">NODE TITLE</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">CHRONOLOGICAL VALUE</label>
              <input
                type="text"
                value={editedChron}
                onChange={(e) => setEditedChron(e.target.value)}
                className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">SUMMARY SPECIFICATION</label>
              <input
                type="text"
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">RICH DETAILED RESEARCH DATA</label>
              <textarea
                rows={6}
                value={editedDetails}
                onChange={(e) => setEditedDetails(e.target.value)}
                className="w-full text-xs font-sans leading-relaxed border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 resize-y"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">TAG ACCENTUATION (COMMA SEPARATED)</label>
              <input
                type="text"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
              />
            </div>

            {editedType === 'person' && (
              <div>
                <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">NATIONALITY</label>
                <input
                  type="text"
                  value={editedNationality}
                  onChange={(e) => setEditedNationality(e.target.value)}
                  placeholder="e.g. Swiss, Soviet, American"
                  className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                />
              </div>
            )}

            {editedType === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">AUTHOR</label>
                  <input
                    type="text"
                    value={editedAuthor}
                    onChange={(e) => setEditedAuthor(e.target.value)}
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">ORIGINAL LANGUAGE</label>
                  <input
                    type="text"
                    value={editedOriginalLanguage}
                    onChange={(e) => setEditedOriginalLanguage(e.target.value)}
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">ALTERNATIVE TITLES</label>
                  <input
                    type="text"
                    value={editedAltTitles}
                    onChange={(e) => setEditedAltTitles(e.target.value)}
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">ABSTRACT / SYNOPSIS</label>
                  <textarea
                    rows={4}
                    value={editedAbstract}
                    onChange={(e) => setEditedAbstract(e.target.value)}
                    className="w-full text-xs font-sans leading-relaxed border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-805 dark:text-neutral-100 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">ATTACHED PDF URL</label>
                  <input
                    type="url"
                    value={editedPdfUrl}
                    onChange={(e) => setEditedPdfUrl(e.target.value)}
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">ATTACHED IMAGE URL</label>
              <input
                type="text"
                value={editedImageUrl}
                onChange={(e) => setEditedImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or raw image link"
                className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 mb-1">IMAGE CAPTION</label>
              <input
                type="text"
                value={editedImageCaption}
                onChange={(e) => setEditedImageCaption(e.target.value)}
                placeholder="Explanatory caption for the image"
                className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-750 dark:text-neutral-300 text-xs font-semibold cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer text-center"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* READ-ONLY VIEWING MODULE */
          <div className="space-y-6">
            <div className={`flex flex-col ${node.imageUrl ? 'sm:flex-row gap-5' : 'gap-4'}`}>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h2 className="font-sans font-bold text-neutral-900 dark:text-neutral-50 text-xl tracking-tight leading-tight">
                    {node.name}
                  </h2>
                  <p className="font-sans text-neutral-600 dark:text-neutral-400 text-sm mt-1.5 leading-relaxed font-normal">
                    {formatTextWithLinks(node.description)}
                  </p>
                </div>

                {/* Display Nationality for Theorists */}
                {node.type === 'person' && (
                  <div className="bg-neutral-50 dark:bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-150 dark:border-neutral-850 inline-flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wider">
                      Nationality:
                    </span>
                    <span className="text-xs font-sans font-semibold text-neutral-800 dark:text-neutral-200" id="fact-nationality">
                      {node.nationality || 'Unspecified'}
                    </span>
                  </div>
                )}

                {/* Display Text Specific Meta */}
                {node.type === 'text' && (
                  <div className="flex flex-col gap-2">
                    <div className="bg-neutral-50 dark:bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-150 dark:border-neutral-850 flex flex-col gap-1 text-xs text-neutral-800 dark:text-neutral-200">
                      <div><strong className="text-[10px] font-mono text-neutral-450 uppercase mr-1">Author:</strong>{node.author || 'Unknown'}</div>
                      <div><strong className="text-[10px] font-mono text-neutral-450 uppercase mr-1">Year:</strong>{node.chronology || 'Unknown'}</div>
                      {node.originalLanguage && <div><strong className="text-[10px] font-mono text-neutral-450 uppercase mr-1">Language:</strong>{node.originalLanguage}</div>}
                      {node.altTitles && <div><strong className="text-[10px] font-mono text-neutral-450 uppercase mr-1">Alt Titles:</strong>{node.altTitles}</div>}
                    </div>
                    {node.abstract && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2.5 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                        <strong className="text-[10px] font-mono text-blue-500 uppercase block mb-1">Abstract / Synopsis</strong>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif">
                          {node.abstract}
                        </p>
                      </div>
                    )}
                    {node.pdfUrl && (
                      <a href={node.pdfUrl} target="_blank" rel="noreferrer" className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                        View Attached PDF
                      </a>
                    )}
                  </div>
                )}
              </div>

              {node.imageUrl && (
                <div className="flex flex-col sm:w-2/5 gap-2">
                  <div 
                    className="aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs relative bg-neutral-100 dark:bg-neutral-950 flex-shrink-0 flex items-center justify-center cursor-zoom-in group/img"
                    onClick={() => setIsImageZoomed(true)}
                    title="Click to pop out image in close-up viewer"
                    id="fact-image-container"
                  >
                    <img
                      src={node.imageUrl}
                      alt={node.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1 rounded-2xl"
                      onError={(e) => {
                        (e.target as HTMLElement).parentElement!.style.display = 'none';
                      }}
                    />
                    {/* Pop out hover indicator */}
                    <div className="absolute inset-0 bg-neutral-955/10 dark:bg-neutral-955/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <span className="bg-white/95 dark:bg-neutral-900/95 text-[10px] text-neutral-850 dark:text-neutral-150 font-bold px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-md flex items-center gap-1 scale-90 group-hover/img:scale-100 transition-transform duration-200 select-none uppercase tracking-wider">
                        🔍 Pop Out
                      </span>
                    </div>
                  </div>
                  {node.imageCaption && (
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 italic text-center leading-tight">
                      {node.imageCaption}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tag List */}
            {node.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Tag className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                {node.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-sans font-medium text-neutral-500 dark:text-neutral-405 bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-850 px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Core Reference Details Block */}
            <div className="space-y-2 border-t border-b border-neutral-100 dark:border-neutral-800 py-4">
              <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                COMPREHENSIVE EXPLORATION NOTES
              </span>
              <div className="text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed space-y-3 font-normal whitespace-pre-line bg-neutral-50/50 dark:bg-neutral-950 p-3 rounded-lg border border-neutral-100 dark:border-neutral-850">
                {formatTextWithLinks(node.details)}
              </div>
            </div>

            {/* Active Connections Mapping Section */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 tracking-wider block">
                RELATIONAL MAP CONTEXTS ({nodeRelations.length})
              </span>

              {nodeRelations.length === 0 ? (
                <p className="text-xs text-neutral-400 dark:text-neutral-505 italic">
                  No spatial connection links formed yet. Press "Draw Link" above to merge this node.
                </p>
              ) : (
                <div className="space-y-2">
                  {nodeRelations.map((rel) => {
                    const isSource = rel.sourceId === node.id;
                    const linked = nodes.find(
                      (n) => n.id === (isSource ? rel.targetId : rel.sourceId)
                    );

                    if (!linked) return null;

                    return (
                      <div
                        key={rel.id}
                        onClick={() => onSelectNode(linked.id)}
                        className="group flex flex-col p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-950 transition duration-150 cursor-pointer text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-[9px] text-neutral-700 dark:text-neutral-300 font-semibold uppercase">
                              {rel.label}
                            </div>
                            {!isReadOnly && (
                              <div className="flex items-center gap-1.5">
                                {relationConfirmId === rel.id ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteRelation?.(rel.id);
                                        setRelationConfirmId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold rounded shadow-sm transition cursor-pointer"
                                      title="Confirm delete relationship"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRelationConfirmId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[9px] font-bold rounded transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRelationConfirmId(rel.id);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition cursor-pointer"
                                    title="Delete relationship link"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 capitalize">
                            Jump to {linked.type} &rarr;
                          </span>
                        </div>
                        <div className="mt-2 text-xs font-sans font-semibold text-neutral-800 dark:text-neutral-250 flex items-center justify-between">
                          <span className="truncate max-w-[80%]">{linked.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded ${getBadgeStyle(linked.type)} scale-90`}>
                            {linked.type}
                          </span>
                        </div>
                        {rel.description && (
                          <div className="mt-2 text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal italic border-l border-neutral-150 dark:border-neutral-800 pl-2">
                            {rel.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timestamps status */}
            <div className="text-[9px] font-mono text-neutral-400 dark:text-neutral-550 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              <span>CREATED: {new Date(node.createdAt).toLocaleDateString()}</span>
              <span>UPDATED: {new Date(node.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Portalled Image Zoom overlay */}
      {isImageZoomed && node.imageUrl && (
        <div 
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-[100] cursor-zoom-out p-6"
          onClick={() => setIsImageZoomed(false)}
          id="pop-out-image-overlay"
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200/50 dark:border-neutral-800 shadow-2xl transition duration-300 scale-100" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-4 right-4 p-2 bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-305 rounded-full transition cursor-pointer z-10"
              title="Close image view"
              id="pop-out-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full flex-1 overflow-hidden flex items-center justify-center rounded-2xl bg-neutral-50 dark:bg-neutral-950 p-2 max-h-[70vh] border border-neutral-150 dark:border-neutral-850">
              <img
                src={node.imageUrl}
                alt={node.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded-xl select-none"
              />
            </div>
            <div className="text-center mt-3.5 select-none">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 font-sans">{node.name}</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-450 mt-1 font-sans">{node.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
