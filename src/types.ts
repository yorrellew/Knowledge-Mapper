/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeType = 'person' | 'theory' | 'concept' | 'text';

export interface EducationalNode {
  id: string;
  type: NodeType;
  name: string;
  description: string; // Brief one-liner description
  details: string; // Dynamic rich detail / markdown text
  chronology: string; // Time/Period representation (e.g. "1896-1980" or "1936")
  chronologyVal: number; // Parsed numerical year for timeline sorting (e.g., 1896)
  tags: string[];
  imageUrl?: string; // Optional image attached to this node
  imageCaption?: string; // Caption for the image
  nationality?: string; // Optional nationality for theorists
  pdfUrl?: string; // Wait, optional pdfUrl for "text" node type
  author?: string; // Author for text sources
  altTitles?: string; // Alternative titles for text sources
  originalLanguage?: string; // Original language
  abstract?: string; // Abstract or synopsis
  x: number; // Custom position on relationship visualization board
  y: number; // Custom position on relationship visualization board
  createdAt: string;
  updatedAt: string;
}

export interface NodeRelation {
  id: string;
  sourceId: string;
  targetId: string;
  label: string; // e.g. "influenced", "formulated", "corroborates", "critiques"
  description: string; // detail notes about this relation
}

export interface QuizQuestion {
  id: string;
  type: 'definition' | 'relationship' | 'chronology' | 'author';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  nodeId?: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  answers: { [questionId: string]: string };
  isFinished: boolean;
}
