/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { EducationalNode, NodeRelation, NodeType } from '../types';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  Database,
  AlertCircle,
  Link,
  ClipboardPaste,
  HelpCircle,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: EducationalNode[];
  relations: NodeRelation[];
  onImportNodesAndRelations: (nodes: EducationalNode[], relations: NodeRelation[]) => void;
  isReadOnly?: boolean;
}

export default function SheetExportModal({
  isOpen,
  onClose,
  nodes,
  relations,
  onImportNodesAndRelations,
  isReadOnly = false,
}: SheetExportModalProps) {
  // Status and feedback states
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [importedSummary, setImportedSummary] = useState<{ nodes: number; relations: number } | null>(null);

  // States for Google Sheets URL sync & text pasting
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [showSchemaHelp, setShowSchemaHelp] = useState<boolean>(false);

  // File picker references
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic drag-and-drop feedback
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Helper: Parse CSV text safely respecting quoted values
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let insideQuote = false;
    let currentField = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (insideQuote) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++; // Skip second quote
          } else {
            insideQuote = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          insideQuote = true;
        } else if (char === ',') {
          row.push(currentField);
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          row.push(currentField);
          currentField = '';
          if (row.length > 0 || row.some(cell => cell.trim() !== '')) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++; // Skip newline spacing
          }
        } else {
          currentField += char;
        }
      }
    }
    
    if (currentField || row.length > 0) {
      row.push(currentField);
      if (row.some(cell => cell.trim() !== '')) {
        lines.push(row);
      }
    }
    
    return lines;
  };

  // Helper: Parse TSV (Tab separated text) copied directly from live spreadsheet cells
  const parseTSV = (text: string): string[][] => {
    return text
      .split(/\r?\n/)
      .filter(line => line.trim() !== '')
      .map(line => line.split('\t').map(cell => {
        let cleaned = cell.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.substring(1, cleaned.length - 1).replace(/""/g, '"');
        }
        return cleaned;
      }));
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        handleImportCSV(file);
      } else {
        setStatus('error');
        setFeedbackMessage('Expected a formatted .csv combined syllabus workbook.');
      }
    }
  };

  // Interactive local download helper for the pristine custom template spreadsheet format
  const handleDownloadTemplate = () => {
    const headers = [
      'ID',
      'Type',
      'Name',
      'Description',
      'Nationality',
      'Author',
      'Abstract',
      'Original Language',
      'PDF URL',
      'Alternative Titles',
      'Image Caption',
      'Chronology',
      'Year Index',
      'Tags',
      'Image URL',
      'Detailed Study Materials',
      'Connected To',
      'Relationship Labels',
      'Relationship Descriptions',
      'Pos X',
      'Pos Y'
    ];

    const sampleRows = [
      [
        'piaget',
        'person',
        'Jean Piaget',
        'Swiss psychologist renowned for his cognitive development theory.',
        'Swiss',
        '', '', '', '', '', '',
        '1896-1980',
        '1896',
        'cognitive; psychologist; developmental',
        'https://images.unsplash.com/photo-1544717305-2782549b5136',
        'Jean Piaget\'s theory of cognitive development suggests that children move through four different stages of mental development.',
        'vygotsky; cognitive-stages',
        'critiques; formulated',
        'Piaget\'s individual developmental model contrasted with Vygotsky\'s socio-cultural model; Piaget mapped these key development epochs.',
        '150',
        '200'
      ],
      [
        'vygotsky',
        'person',
        'Lev Vygotsky',
        'Soviet psychologist who developed the Social Development Theory.',
        'Soviet',
        '', '', '', '', '', '',
        '1896-1934',
        '1896',
        'cognitive; psychologist; educational',
        '',
        'Vygotsky\'s sociocultural theory of cognitive development focuses on social interaction as primary scaffolding.',
        'social-constructivism',
        'pioneered',
        'Vygotsky pioneered scaffolded and interactive construction of concepts.',
        '450',
        '200'
      ],
      [
        'cognitive-stages',
        'theory',
        'Cognitive Development Stages',
        'Piaget\'s four core stages of child mental growth.',
        '',
        '', '', '', '', '', '',
        '1936',
        '1936',
        'theory; stages',
        '',
        'Covers Sensorimotor, Preoperational, Concrete Operational, and Formal Operational developmental epochs.',
        'assimilation',
        'includes',
        'Assimilation is the core cognitive integration mechanism.',
        '',
        ''
      ],
      [
        'assimilation',
        'concept',
        'Assimilation & Accommodation',
        'Adaptation processes for cognitive schema restructuring.',
        '',
        '', '', '', '', '', '',
        '1952',
        '1952',
        'concept; cognitive',
        '',
        'How individuals modify internal mental maps to adapt and learn from outer environment cues.',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'social-constructivism',
        'theory',
        'Social Constructivism',
        'Learning model emphasizing cultural & peer scaffolded development.',
        '',
        '', '', '', '', '', '',
        '1930',
        '1930',
        'theory; constructivism; social',
        '',
        'Focuses on the Zone of Proximal Development (ZPD) and societal learning scaffolds.',
        '',
        '',
        '',
        '',
        ''
      ]
    ];

    let csvContent = headers.join(',') + '\n';
    sampleRows.forEach(row => {
      const escaped = row.map(val => {
        const clean = (val || '').replace(/"/g, '""');
        return `"${clean}"`;
      });
      csvContent += escaped.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'syllabus_knowledge_map_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus('success');
    setFeedbackMessage('Syllabus template downloaded successfully! This workbook represents the new, extremely editable single-row format with connections listed directly next to entities.');
  };

  // Export entire active workspace (nodes + relationships) in the pristine single-row format
  const handleExportCombinedCSV = () => {
    try {
      const headers = [
        'ID',
        'Type',
        'Name',
        'Description',
        'Nationality',
        'Author',
        'Abstract',
        'Original Language',
        'PDF URL',
        'Alternative Titles',
        'Image Caption',
        'Chronology',
        'Year Index',
        'Tags',
        'Image URL',
        'Detailed Study Materials',
        'Connected To',
        'Relationship Labels',
        'Relationship Descriptions',
        'Pos X',
        'Pos Y'
      ];

      let csvContent = headers.join(',') + '\n';

      nodes.forEach((n) => {
        // Collect all outbound links originating from this node
        const related = relations.filter(r => r.sourceId === n.id);
        
        const connectedToIds = related.map(r => r.targetId).join('; ');
        const relationshipLabels = related.map(r => r.label).join('; ');
        const relationshipDescs = related.map(r => r.description).join('; ');

        const row = [
          n.id || '',
          n.type || 'concept',
          n.name || '',
          n.description || '',
          n.nationality || '',
          n.author || '',
          n.abstract || '',
          n.originalLanguage || '',
          n.pdfUrl || '',
          n.altTitles || '',
          n.imageCaption || '',
          n.chronology || '',
          n.chronologyVal !== undefined ? n.chronologyVal.toString() : '',
          (n.tags || []).join('; '),
          n.imageUrl || '',
          n.details || '',
          connectedToIds,
          relationshipLabels,
          relationshipDescs,
          n.x !== undefined ? Math.round(n.x).toString() : '',
          n.y !== undefined ? Math.round(n.y).toString() : ''
        ];

        const escaped = row.map(val => {
          const clean = val.replace(/"/g, '""');
          return `"${clean}"`;
        });
        csvContent += escaped.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `syllabus-knowledge-map-${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus('success');
      setFeedbackMessage('Syllabus sheet exported successfully! Current X/Y coordinates have been saved inside the file.');
      setImportedSummary(null);
    } catch (err: any) {
      setStatus('error');
      setFeedbackMessage(`Export failed: ${err.message || err}`);
    }
  };

  // SPRING-FORCE RELAXATION ALGORITHM
  // Automatically spreads nodes into an elegant, non-overlapping web while keeping existing ones as stable as possible
  const relaxGraph = (
    allNodes: EducationalNode[],
    allRelations: NodeRelation[],
    newlyAddedIds: Set<string>
  ): EducationalNode[] => {
    // Make a clone of the nodes array to mutate positions
    const relaxed = allNodes.map((n) => ({ ...n }));

    const idealLinkDistance = 220; // Preferred length of connection lines
    const totalIterations = 100;
    const coolingFactor = 0.94;
    let temperature = 35.0; // Restrains extreme movements over iterations

    for (let step = 0; step < totalIterations; step++) {
      // Create force accumulation maps
      const forceX = new Map<string, number>();
      const forceY = new Map<string, number>();
      
      relaxed.forEach((n) => {
        forceX.set(n.id, 0);
        forceY.set(n.id, 0);
      });

      // 1. REPULSION FORCE (all-pairs Coulomb-like repulsion to avoid overlaps)
      for (let i = 0; i < relaxed.length; i++) {
        const u = relaxed[i];
        for (let j = i + 1; j < relaxed.length; j++) {
          const v = relaxed[j];
          const dx = u.x - v.x;
          const dy = u.y - v.y;
          const distSq = dx * dx + dy * dy + 1; // avoid divide-by-zero
          const dist = Math.sqrt(distSq);

          if (dist < 450) {
            // Stronger repulsion if nodes are too close
            const magnitude = 15000 / distSq;
            const fx = (dx / dist) * magnitude;
            const fy = (dy / dist) * magnitude;

            forceX.set(u.id, forceX.get(u.id)! + fx);
            forceY.set(u.id, forceY.get(u.id)! + fy);
            forceX.set(v.id, forceX.get(v.id)! - fx);
            forceY.set(v.id, forceY.get(v.id)! - fy);
          }
        }
      }

      // 2. ATTRACTION FORCE (Hooke's spring force along related connection vectors)
      allRelations.forEach((rel) => {
        const u = relaxed.find((n) => n.id === rel.sourceId);
        const v = relaxed.find((n) => n.id === rel.targetId);
        if (!u || !v) return;

        const dx = u.x - v.x;
        const dy = u.y - v.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;

        const displacement = dist - idealLinkDistance;
        const springConstant = 0.15;
        const magnitude = displacement * springConstant;
        
        const fx = (dx / dist) * magnitude;
        const fy = (dy / dist) * magnitude;

        forceX.set(u.id, forceX.get(u.id)! - fx);
        forceY.set(u.id, forceY.get(u.id)! - fy);
        forceX.set(v.id, forceX.get(v.id)! + fx);
        forceY.set(v.id, forceY.get(v.id)! + fy);
      });

      // 3. APPLY ACCUMULATED FORCES RESPECTING FIXED vs NEW CONSTRAINTS
      relaxed.forEach((node) => {
        const isNew = newlyAddedIds.has(node.id);
        
        // If existing/fixed, susceptibility is extremely close to 0 to preserve original layout as requested
        // ("it should try and move existing entities as little as possible")
        const susceptibility = isNew ? 1.0 : 0.04;

        let fx = forceX.get(node.id)!;
        let fy = forceY.get(node.id)!;

        // Clip maximum force bound to the current temperature
        const forceMag = Math.sqrt(fx * fx + fy * fy) + 0.1;
        if (forceMag > temperature) {
          fx = (fx / forceMag) * temperature;
          fy = (fy / forceMag) * temperature;
        }

        node.x += fx * susceptibility;
        node.y += fy * susceptibility;

        // Boundary safety clamps
        node.x = Math.max(-1000, Math.min(4000, node.x));
        node.y = Math.max(-1000, Math.min(4000, node.y));
      });

      temperature *= coolingFactor;
    }

    return relaxed.map((n) => ({
      ...n,
      x: Math.round(n.x),
      y: Math.round(n.y)
    }));
  };

  // Shared processor for parsed CSV/TSV table records
  const processSpreadsheetRows = (rows: string[][]) => {
    if (rows.length < 2) {
      throw new Error('Spreadsheet has no data records below headers.');
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());

    // Auto-detect index keys matching our headers
    const idxId = headers.findIndex(h => h === 'id' || h.replace(/\s+/g, '') === 'entityid' || h.includes('unique'));
    const idxType = headers.findIndex(h => h === 'type' || h.includes('node type') || h.includes('category'));
    const idxName = headers.findIndex(h => h === 'name' || h.includes('title') || h.includes('display'));
    const idxDesc = headers.findIndex(h => h === 'description' || h.includes('desc') || h.includes('summary'));
    const idxNationality = headers.findIndex(h => h.includes('nationality'));
    const idxChron = headers.findIndex(h => h.includes('chronology') || h.includes('context') || h.includes('era') || h.includes('period'));
    const idxYear = headers.findIndex(h => h.includes('year') || h.includes('index') || h.includes('chronval'));
    const idxTags = headers.findIndex(h => h.includes('tag'));
    const idxImg = headers.findIndex(h => h.includes('image') || h.includes('url') || h.includes('cover'));
    const idxDetails = headers.findIndex(h => h.includes('material') || h.includes('detail') || h.includes('study'));

    // Text extension fields
    const idxAuthor = headers.findIndex(h => h.includes('author') || h === 'writer');
    const idxAbstract = headers.findIndex(h => h.includes('abstract') || h.includes('synopsis'));
    const idxLanguage = headers.findIndex(h => h.includes('language') || h.includes('original written'));
    const idxPdfUrl = headers.findIndex(h => h.includes('pdf url') || h === 'pdf' || h.includes('document url'));
    const idxAltTitles = headers.findIndex(h => h.includes('alternative title') || h.includes('alt title'));
    const idxImgCaption = headers.findIndex(h => h.includes('image caption') || h.includes('caption'));

    // Relationship specific keys right on the same rows
    const idxConnectedTo = headers.findIndex(h => h.includes('connected to') || h.includes('target ids') || h.includes('links to') || h.includes('related to'));
    const idxLabels = headers.findIndex(h => h.includes('label') || h.includes('relationship') || h.includes('link text'));
    const idxRelDescs = headers.findIndex(h => h.includes('relationship desc') || h.includes('connection desc') || h.includes('context desc') || h.includes('relationship details'));

    // Opt coordinate parameters (if present)
    const idxPosX = headers.findIndex(h => h === 'pos x' || h === 'x' || h === 'coordinate x');
    const idxPosY = headers.findIndex(h => h === 'pos y' || h === 'y' || h === 'coordinate y');

    // Keep reference of current positions inside workspace relative to their ID
    const currentPositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => {
      currentPositions.set(n.id, { x: n.x, y: n.y });
    });

    const parsedNodes: EducationalNode[] = [];
    const parsedRelations: NodeRelation[] = [];
    const newlyAddedIds = new Set<string>();

    // Step 1: Parse entities and store relationship rows inline
    const rawRelationRows: Array<{
      sourceId: string;
      rawTargets: string;
      rawLabels: string;
      rawDescs: string;
    }> = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.length === 0 || !r.some(cell => cell.trim() !== '')) continue;

      // Extract details
      const rawName = (idxName !== -1 && r[idxName]) ? r[idxName].trim() : '';
      if (!rawName) continue; // Skip rows lacking names

      const id = (idxId !== -1 && r[idxId]) ? r[idxId].trim().toLowerCase() : rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
      const rawType = (idxType !== -1 && r[idxType]) ? r[idxType].trim().toLowerCase() : 'concept';
      const type = ['person', 'theory', 'concept', 'text'].includes(rawType) ? (rawType as NodeType) : 'concept';
      const description = (idxDesc !== -1 && r[idxDesc]) ? r[idxDesc].trim() : '';
      const nationality = (idxNationality !== -1 && r[idxNationality]) ? r[idxNationality].trim() : '';
      const chronology = (idxChron !== -1 && r[idxChron]) ? r[idxChron].trim() : 'N/A';
      const chronologyVal = (idxYear !== -1 && r[idxYear] && parseInt(r[idxYear])) ? parseInt(r[idxYear]) : (parseInt(chronology.split('-')[0]) || 1900);
      
      let tags: string[] = [];
      if (idxTags !== -1 && r[idxTags]) {
        tags = r[idxTags].split(/[;,]+/).map(t => t.trim()).filter(Boolean);
      }

      const imageUrl = (idxImg !== -1 && r[idxImg]) ? r[idxImg].trim() : undefined;
      const details = (idxDetails !== -1 && r[idxDetails]) ? r[idxDetails].trim() : 'Review instructions and learning summaries.';

      // Text specific extracting
      const author = (idxAuthor !== -1 && r[idxAuthor]) ? r[idxAuthor].trim() : undefined;
      const abstractStr = (idxAbstract !== -1 && r[idxAbstract]) ? r[idxAbstract].trim() : undefined;
      const originalLanguage = (idxLanguage !== -1 && r[idxLanguage]) ? r[idxLanguage].trim() : undefined;
      const pdfUrl = (idxPdfUrl !== -1 && r[idxPdfUrl]) ? r[idxPdfUrl].trim() : undefined;
      const altTitles = (idxAltTitles !== -1 && r[idxAltTitles]) ? r[idxAltTitles].trim() : undefined;
      const imageCaption = (idxImgCaption !== -1 && r[idxImgCaption]) ? r[idxImgCaption].trim() : undefined;

      // Coordinates
      let posX: number | undefined;
      let posY: number | undefined;

      if (idxPosX !== -1 && r[idxPosX] && !isNaN(parseFloat(r[idxPosX]))) {
        posX = parseFloat(r[idxPosX]);
      }
      if (idxPosY !== -1 && r[idxPosY] && !isNaN(parseFloat(r[idxPosY]))) {
        posY = parseFloat(r[idxPosY]);
      }

      // Check if we have active positions stored in existing workspace
      const matchedPosition = currentPositions.get(id);
      
      let finalX = 0;
      let finalY = 0;
      let hasPosition = false;

      if (matchedPosition) {
        // Keep existing coordinates from workspace memory
        finalX = matchedPosition.x;
        finalY = matchedPosition.y;
        hasPosition = true;
      } else if (posX !== undefined && posY !== undefined) {
        // Use coordinates explicitly defined in CSV
        finalX = posX;
        finalY = posY;
        hasPosition = true;
      } else {
        // Mark as brand new node needs nestling layout placement
        newlyAddedIds.add(id);
      }

      parsedNodes.push({
        id,
        type,
        name: rawName,
        description,
        nationality: type === 'person' ? (nationality || undefined) : undefined,
        author: type === 'text' ? author : undefined,
        abstract: type === 'text' ? abstractStr : undefined,
        originalLanguage: type === 'text' ? originalLanguage : undefined,
        pdfUrl: type === 'text' ? pdfUrl : undefined,
        altTitles: type === 'text' ? altTitles : undefined,
        imageCaption,
        chronology,
        chronologyVal,
        tags,
        imageUrl: imageUrl || undefined,
        details,
        x: finalX,
        y: finalY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Track raw connections text for Step 2
      const rawTargets = (idxConnectedTo !== -1 && r[idxConnectedTo]) ? r[idxConnectedTo].trim() : '';
      const rawLabels = (idxLabels !== -1 && r[idxLabels]) ? r[idxLabels].trim() : '';
      const rawDescs = (idxRelDescs !== -1 && r[idxRelDescs]) ? r[idxRelDescs].trim() : '';

      if (rawTargets) {
        rawRelationRows.push({
          sourceId: id,
          rawTargets,
          rawLabels,
          rawDescs
        });
      }
    }

    if (parsedNodes.length === 0) {
      throw new Error('Could not compile any valid Educational entities.');
    }

    // Step 2: Unfold Semicolon or comma separated relationships
    rawRelationRows.forEach(item => {
      // Split target IDs (by semicolon or comma)
      const targets = item.rawTargets.split(/[;,]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
      const labels = item.rawLabels.split(/[;,]+/).map(l => l.trim().toLowerCase()).filter(Boolean);
      const descs = item.rawDescs.split(/[;]+/).map(d => d.trim()).filter(Boolean);

      targets.forEach((targetId, index) => {
        const label = labels[index] || labels[0] || 'influenced';
        const description = descs[index] || descs[0] || `Theoretical connection between ${item.sourceId} and ${targetId}.`;

        const relId = `rel-${item.sourceId}-${targetId}-${index}`;
        // Ensure destination node exists in the spreadsheet
        parsedRelations.push({
          id: relId,
          sourceId: item.sourceId,
          targetId,
          label,
          description
        });
      });
    });

    // Step 3: Compute beautiful auto nestled coords for New Nodes
    // Find average position center of existing graph as fallback spot
    let sumX = 0;
    let sumY = 0;
    let positionedCount = 0;

    parsedNodes.forEach((node) => {
      if (!newlyAddedIds.has(node.id)) {
        sumX += node.x;
        sumY += node.y;
        positionedCount++;
      }
    });

    const graphCenterX = positionedCount > 0 ? sumX / positionedCount : 400;
    const graphCenterY = positionedCount > 0 ? sumY / positionedCount : 300;

    // Initially position each new node close to its connected neighbors
    parsedNodes.forEach((node) => {
      if (newlyAddedIds.has(node.id)) {
        // Find connected adjacent neighbors from parsed relationship vectors
        const connections = parsedRelations.filter(
          r => r.sourceId === node.id || r.targetId === node.id
        );

        let sumConnectedX = 0;
        let sumConnectedY = 0;
        let connectedCount = 0;

        connections.forEach((rel) => {
          const neighborId = rel.sourceId === node.id ? rel.targetId : rel.sourceId;
          const neighbor = parsedNodes.find(n => n.id === neighborId);
          
          // Only pull position if neighbor has a fixed layout position already
          if (neighbor && !newlyAddedIds.has(neighbor.id)) {
            sumConnectedX += neighbor.x;
            sumConnectedY += neighbor.y;
            connectedCount++;
          }
        });

        if (connectedCount > 0) {
          // Nestle in the average midst of connected neighbors with a tight random offset
          node.x = sumConnectedX / connectedCount + (Math.random() * 30 - 15);
          node.y = sumConnectedY / connectedCount + (Math.random() * 30 - 15);
        } else {
          // Place near global center of mapped graph
          node.x = graphCenterX + (Math.random() * 200 - 100);
          node.y = graphCenterY + (Math.random() * 200 - 100);
        }
      }
    });

    // Step 4: Run iterative local spring relaxation physics to stretch web smoothly
    const finalNodes = relaxGraph(parsedNodes, parsedRelations, newlyAddedIds);

    // Save final datasets back into state
    onImportNodesAndRelations(finalNodes, parsedRelations);
    
    setStatus('success');
    setFeedbackMessage(
      `Syllabus spreadsheet synchronised successfully! Loaded ${finalNodes.length} entities and ${parsedRelations.length} connection links into an interactive web layout.`
    );
    setImportedSummary({
      nodes: finalNodes.length,
      relations: parsedRelations.length
    });
  };

  // Import combined local CSV file
  const handleImportCSV = (file: File) => {
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        processSpreadsheetRows(rows);
      } catch (err: any) {
        setStatus('error');
        setFeedbackMessage(`Workbook load failure: ${err.message || 'Verify correct CSV formatting.'}`);
      }
    };
    fileReader.readAsText(file);
  };

  // Fast fetch synchroniser for Google Sheets share link
  const handleSyncGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      setStatus('error');
      setFeedbackMessage('Please paste a Google Sheets share link first.');
      return;
    }

    setIsSyncing(true);
    setStatus('idle');
    setFeedbackMessage('Polling Google Sheet records live...');

    try {
      const idMatch = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!idMatch || !idMatch[1]) {
        throw new Error('Invalid URL format. Could not locate Google Spreadsheet ID.');
      }
      const spreadsheetId = idMatch[1];

      const gidMatch = googleSheetUrl.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';

      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(
          "Connection failed. Please ensure the Google Sheets sharing option is set to 'Anyone with the link can view'."
        );
      }

      const rawCsvText = await response.text();
      const rows = parseCSV(rawCsvText);
      processSpreadsheetRows(rows);
    } catch (err: any) {
      setStatus('error');
      setFeedbackMessage(err.message || 'Network synchronisation failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Direct copy-paste cells parser
  const handleImportPastedText = () => {
    if (!pastedText.trim()) {
      setStatus('error');
      setFeedbackMessage('Please paste copied table cells first.');
      return;
    }

    try {
      const rows = parseTSV(pastedText);
      processSpreadsheetRows(rows);
      setPastedText(''); // reset paste context
    } catch (err: any) {
      setStatus('error');
      setFeedbackMessage(`Pasted grid parse failure: ${err.message || err}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-colors duration-200">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl relative border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh] overflow-y-auto text-neutral-800 dark:text-neutral-100 transition-colors duration-200"
      >
        {/* Absolute Close */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer transition flex items-center justify-center"
          id="close-export-modal"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-5 select-none text-left">
          <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-950 rounded-2xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 border border-neutral-150 dark:border-neutral-800 flex-shrink-0 transition-colors duration-200">
            <Database className="w-6 h-6 text-neutral-800 dark:text-neutral-100" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-neutral-900 dark:text-neutral-50 text-base leading-tight">
              Syllabus Sheets Sync
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
              Comfortably edit, map, and import complete educational frameworks using any standard spreadsheet software like Google Sheets.
            </p>
          </div>
        </div>

        {/* DOWLOAD TEMPLATE AREA */}
        {!isReadOnly && (
          <div className="mb-5 p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left transition-colors duration-200">
            <div className="space-y-1 select-none">
              <h4 className="font-sans font-bold text-emerald-800 dark:text-emerald-350 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Interactive Sheets Template
              </h4>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-normal">
                Download our highly user-friendly template file where relationships are declared right next to entity records. X/Y coords are completely optional!
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer font-sans shadow-sm whitespace-nowrap"
            >
              Download CSV Template <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* State Alerts Container */}
        <AnimatePresence mode="wait">
          {status !== 'idle' && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="mb-4 overflow-hidden"
            >
              <div className={`p-4 rounded-2xl border flex items-start gap-3 text-left ${
                status === 'success' 
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-850 dark:text-emerald-300' 
                  : 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-850 dark:text-rose-300'
              }`}>
                {status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-xs select-none">
                    {status === 'success' ? 'Import Complete' : 'Operations Feedback'}
                  </h4>
                  <p className="text-[11px] mt-1 font-normal leading-relaxed">{feedbackMessage}</p>
                  
                  {importedSummary && (
                    <div className="flex gap-4 mt-2 border-t border-emerald-150/40 dark:border-emerald-900/20 pt-2 font-mono text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      <span>👤 Active Entities: {importedSummary.nodes}</span>
                      <span>🔗 Connections Generated: {importedSummary.relations}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BODY INPUT ACTIONS */}
        <div className="space-y-4 text-left">
          
          {!isReadOnly && (
            <>
              {/* OPTION A: SYNC URL */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-150 dark:border-neutral-850 rounded-2xl space-y-2 text-left transition-colors duration-200">
                <div className="flex items-center gap-1.5 select-none">
                  <Link className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs uppercase tracking-wide font-sans">
                    Option A: Fast Sync by URL Link
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none leading-relaxed">
                  Paste your Google Sheet web sharing URL. Make sure spreadsheet sharing is set to 
                  <strong className="text-neutral-700 dark:text-neutral-300 font-semibold select-all"> 'Anyone with the link can view'</strong> so our auto-nestling engine can retrieve the live data rows.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                    className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-820 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-450 transition"
                  />
                  <button
                    type="button"
                    onClick={handleSyncGoogleSheet}
                    disabled={isSyncing}
                    className="bg-neutral-950 dark:bg-neutral-850 hover:bg-neutral-900 dark:hover:bg-neutral-800 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none font-sans flex-shrink-0"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Link'}
                  </button>
                </div>
              </div>

              {/* OPTION B: PASTE DIRECTLY */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-150 dark:border-neutral-850 rounded-2xl space-y-2 text-left transition-colors duration-200">
                <div className="flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <ClipboardPaste className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs uppercase tracking-wide font-sans">
                      Option B: Copy & Paste Sheet Cells
                    </h4>
                  </div>
                  <span className="text-[8.5px] font-mono font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-450 dark:text-neutral-500 border border-neutral-150 dark:border-neutral-850 px-1.5 py-0.5 rounded uppercase">
                    Zero Configuration
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed select-none">
                  Highlight block rows inside your local spreadsheet (<kbd className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1 rounded">Ctrl+C</kbd> / Cmd+C) and paste the clipboard contents right below:
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste highlighted cell ranges here (remember to include headers Row ID, Name...)"
                    className="w-full h-24 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-[10px] font-mono text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition"
                  />
                  <button
                    type="button"
                    onClick={handleImportPastedText}
                    className="self-end bg-neutral-950 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer select-none font-sans shadow-xs"
                  >
                    Load Pasted Cells
                  </button>
                </div>
              </div>
            </>
          )}

          {/* DOWLOAD CSV OR DROP FILE */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-150 dark:border-neutral-850 rounded-2xl space-y-3.5 select-none transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-neutral-150 dark:border-neutral-850 pb-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500 animate-bounce" />
                <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs uppercase tracking-wide font-sans">
                  Option C: Drag & Drop Workbook CSV
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaHelp(!showSchemaHelp)}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition text-[10px] uppercase font-bold tracking-wider font-sans cursor-pointer flex items-center gap-0.5"
              >
                <HelpCircle className="w-3.5 h-3.5" /> {showSchemaHelp ? 'Hide structure columns' : 'Show columns blueprint'}
              </button>
            </div>

            {/* Expandable column guide details */}
            <AnimatePresence>
              {showSchemaHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="text-[9.5px] font-mono bg-neutral-100 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 space-y-2 leading-relaxed">
                    <div className="border-b border-neutral-200 dark:border-neutral-800 pb-1">
                      <strong className="text-neutral-750 dark:text-neutral-300">Editable Combined CSV Columns:</strong>
                    </div>
                    <p>
                      Include these exact headers in your first spreadsheet row:
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-neutral-600 dark:text-neutral-400">
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">ID:</b> unique lower case identifier</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Type:</b> person / theory / concept</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Name:</b> display name label</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Description:</b> brief summary</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Chronology:</b> visual timeline range</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Year Index:</b> numerical timeline sort year</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Tags:</b> semicolon-separated key words</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Connected To:</b> target IDs (semicolon list)</div>
                      <div>• <b className="text-neutral-700 dark:text-neutral-300">Relationship Labels:</b> link types list</div>
                    </div>
                    <p className="text-[9px] text-indigo-500 border-t border-neutral-200 dark:border-neutral-800 pt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> Our advanced layouts physics nestles any new item without coords beautifully in-between neighbors!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drop CSV */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-4.5 text-center transition-all ${
                isDragging 
                  ? 'border-neutral-800 dark:border-neutral-200 bg-neutral-100/40 dark:bg-neutral-900/40' 
                  : 'border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/10'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-5 h-5 text-neutral-450 dark:text-neutral-500" />
                <div>
                  <h6 className="font-bold text-xs text-neutral-750 dark:text-neutral-200">
                    Upload Combined CSV File
                  </h6>
                  <p className="text-[9.5px] text-neutral-450 dark:text-neutral-500 mt-0.5">
                    Drag-and-drop your customized <b className="font-mono text-[9px] uppercase font-bold">.csv</b> sheet here, or click to browse.
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImportCSV(e.target.files[0]);
                    }
                  }} 
                />
              </div>
            </div>

            {/* Downloader for Current workspace CSV */}
            <div className="pt-2 border-t border-neutral-150/40 dark:border-neutral-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
              <div className="text-[10px] text-neutral-450 max-w-xs leading-relaxed">
                Compile & download your current interactive canvas map workspace as a beautifully synchronized unified spreadsheet file.
              </div>
              <button
                onClick={handleExportCombinedCSV}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-750 text-white font-semibold text-xs px-4.5 py-3 rounded-xl transition cursor-pointer shadow-sm font-sans flex-shrink-0"
              >
                <Download className="w-4 h-4" /> Download Unified CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer info line */}
        <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-3.5 flex items-center gap-2 select-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-[10px] text-neutral-450 font-medium">
            Local sheets sync automatically calculates topological physics on-device instantly.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
