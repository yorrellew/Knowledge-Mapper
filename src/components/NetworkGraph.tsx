/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { EducationalNode, NodeRelation, NodeType } from '../types';
import { Plus, Maximize2, ZoomIn, ZoomOut, Link, ArrowRight, X, Sparkles, Move, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkGraphProps {
  nodes: EducationalNode[];
  relations: NodeRelation[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateNodes: (nodes: EducationalNode[]) => void;
  onAddRelation: (relation: NodeRelation) => void;
  onAddNode: (node: EducationalNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteRelation?: (relationId: string) => void;
  isReadOnly?: boolean;
}

export default function NetworkGraph({
  nodes,
  relations,
  selectedNodeId,
  onSelectNode,
  onUpdateNodes,
  onAddRelation,
  onAddNode,
  onDeleteNode,
  onDeleteRelation,
  isReadOnly = false,
}: NetworkGraphProps) {
  // SVG and panning states
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node dragging states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodeClickStartRef = useRef<{ id: string; clientX: number; clientY: number; time: number } | null>(null);
  const layoutAnimRef = useRef<number | null>(null);

  // Clean up any active layout animation on unmount
  useEffect(() => {
    return () => {
      if (layoutAnimRef.current !== null) {
        cancelAnimationFrame(layoutAnimRef.current);
      }
    };
  }, []);

  // Creation Modals
  const [isAddNodeOpen, setIsAddNodeOpen] = useState<boolean>(false);
  const [isAddRelationOpen, setIsAddRelationOpen] = useState<boolean>(false);
  const [isHintVisible, setIsHintVisible] = useState<boolean>(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Fields for new node
  const [newNodeType, setNewNodeType] = useState<NodeType>('concept');
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeDesc, setNewNodeDesc] = useState<string>('');
  const [newNodeDetails, setNewNodeDetails] = useState<string>('');
  const [newNodeChron, setNewNodeChron] = useState<string>('');
  const [newNodeTags, setNewNodeTags] = useState<string>('');
  const [newNodeImageUrl, setNewNodeImageUrl] = useState<string>('');
  const [newNodeNationality, setNewNodeNationality] = useState<string>('');

  // Form Fields for new relation
  const [relSourceId, setRelSourceId] = useState<string>('');
  const [relTargetId, setRelTargetId] = useState<string>('');
  const [relLabel, setRelLabel] = useState<string>('');
  const [relDesc, setRelDesc] = useState<string>('');

  // Dimensions of nodes
  const nodeWidth = 200;
  const nodeHeight = 84;

  // Zoom handling helper
  const handleZoom = (factor: number) => {
    setZoomScale((prev) => Math.max(0.3, Math.min(3, prev * factor)));
  };

  const handleResetZoom = () => {
    setPanX(0);
    setPanY(0);
    setZoomScale(1);
  };

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;

    // Cancel any active animation frame
    if (layoutAnimRef.current !== null) {
      cancelAnimationFrame(layoutAnimRef.current);
    }

    // 1. Detect connected components (clusters)
    const clusters: Record<string, number> = {};
    let clusterCount = 0;
    const visited = new Set<string>();

    const adj: Record<string, string[]> = {};
    nodes.forEach((n) => {
      adj[n.id] = [];
    });
    relations.forEach((r) => {
      if (adj[r.sourceId] && adj[r.targetId]) {
        adj[r.sourceId].push(r.targetId);
        adj[r.targetId].push(r.sourceId);
      }
    });

    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        clusterCount++;
        const queue = [node.id];
        visited.add(node.id);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          clusters[curr] = clusterCount;
          adj[curr]?.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }
      }
    });

    // Determine target center for each cluster to keep them well-spaced on a circular or grid layout
    const clusterCenters: Record<number, { x: number; y: number }> = {};
    const baseCenterX = 450;
    const baseCenterY = 300;

    if (clusterCount <= 1) {
      clusterCenters[1] = { x: baseCenterX, y: baseCenterY };
    } else {
      // Space clusters dynamically around the center
      const clusterRadius = Math.max(320, clusterCount * 140);
      for (let c = 1; c <= clusterCount; c++) {
        const angle = ((c - 1) / clusterCount) * 2 * Math.PI;
        clusterCenters[c] = {
          x: baseCenterX + Math.cos(angle) * clusterRadius,
          y: baseCenterY + Math.sin(angle) * clusterRadius,
        };
      }
    }

    // Parameters for simulated annealing to find optimal layout in memory
    const totalSimIterations = 240;
    const springLength = 240; 
    const springStrength = 0.08;
    const repulsionStrength = 150000;
    const gravityStrength = 0.025; 
    const damping = 0.80;

    // Jitter initial duplicate positions to prevent divide-by-zero or overlap traps
    let simNodes = nodes.map((node, index) => {
      const isDuplicate = nodes.some((n, idx) => idx < index && n.x === node.x && n.y === node.y);
      if (isDuplicate) {
        return {
          ...node,
          x: node.x + (Math.random() - 0.5) * 60,
          y: node.y + (Math.random() - 0.5) * 60,
        };
      }
      return node;
    });

    // Initialize velocities
    const velocities = simNodes.reduce((acc, node) => {
      acc[node.id] = { vx: 0, vy: 0 };
      return acc;
    }, {} as Record<string, { vx: number; vy: number }>);

    // Run physics synchronously in memory to find the optimal settled layout positions
    for (let simFrame = 0; simFrame < totalSimIterations; simFrame++) {
      const forces = simNodes.reduce((acc, node) => {
        acc[node.id] = { fx: 0, fy: 0 };
        return acc;
      }, {} as Record<string, { fx: number; fy: number }>);

      // Repulsion + Overlap Prevention
      for (let i = 0; i < simNodes.length; i++) {
        const u = simNodes[i];
        for (let j = i + 1; j < simNodes.length; j++) {
          const v = simNodes[j];

          const dx = (u.x + nodeWidth / 2) - (v.x + nodeWidth / 2);
          const dy = (u.y + nodeHeight / 2) - (v.y + nodeHeight / 2);
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);

          if (dist < 1200) {
            const force = repulsionStrength / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            forces[u.id].fx += fx;
            forces[u.id].fy += fy;
            forces[v.id].fx -= fx;
            forces[v.id].fy -= fy;
          }

          // Bounding box separation to completely prevent node overlaps
          const minSeparationX = nodeWidth + 60; // 60px padding
          const minSeparationY = nodeHeight + 45; // 45px padding
          const overlapX = minSeparationX - Math.abs(dx);
          const overlapY = minSeparationY - Math.abs(dy);

          if (overlapX > 0 && overlapY > 0) {
            const pushForceX = overlapX * 0.25;
            const pushForceY = overlapY * 0.25;
            const dirX = dx >= 0 ? 1 : -1;
            const dirY = dy >= 0 ? 1 : -1;

            forces[u.id].fx += dirX * pushForceX;
            forces[u.id].fy += dirY * pushForceY;
            forces[v.id].fx -= dirX * pushForceX;
            forces[v.id].fy -= dirY * pushForceY;
          }
        }
      }

      // Attraction along relations
      relations.forEach((rel) => {
        const u = simNodes.find((n) => n.id === rel.sourceId);
        const v = simNodes.find((n) => n.id === rel.targetId);
        if (!u || !v) return;

        const dx = (v.x + nodeWidth / 2) - (u.x + nodeWidth / 2);
        const dy = (v.y + nodeHeight / 2) - (u.y + nodeHeight / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const displacement = dist - springLength;
        const force = springStrength * displacement;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        forces[u.id].fx += fx;
        forces[u.id].fy += fy;
        forces[v.id].fx -= fx;
        forces[v.id].fy -= fy;
      });

      // Cluster gravity
      simNodes.forEach((node) => {
        const clusterId = clusters[node.id] || 1;
        const target = clusterCenters[clusterId] || { x: baseCenterX, y: baseCenterY };

        const dx = target.x - (node.x + nodeWidth / 2);
        const dy = target.y - (node.y + nodeHeight / 2);

        let gfx = dx * gravityStrength;
        let gfy = dy * gravityStrength;
        const gForce = Math.sqrt(gfx * gfx + gfy * gfy);
        const maxGravityForce = 5;
        if (gForce > maxGravityForce) {
          gfx = (gfx / gForce) * maxGravityForce;
          gfy = (gfy / gForce) * maxGravityForce;
        }

        forces[node.id].fx += gfx;
        forces[node.id].fy += gfy;
      });

      // Update in-memory position
      simNodes = simNodes.map((node) => {
        const f = forces[node.id];
        const v = velocities[node.id];

        v.vx = (v.vx + f.fx) * damping;
        v.vy = (v.vy + f.fy) * damping;

        const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
        const maxSpeed = 30;
        if (speed > maxSpeed) {
          v.vx = (v.vx / speed) * maxSpeed;
          v.vy = (v.vy / speed) * maxSpeed;
        }

        return {
          ...node,
          x: node.x + v.vx,
          y: node.y + v.vy,
        };
      });
    }

    // Now we animate from the initial nodes position to the optimal positions using a smooth cubic ease-in-out curve
    const startPositions = nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.x, y: node.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    const targetPositions = simNodes.reduce((acc, node) => {
      acc[node.id] = { x: node.x, y: node.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    const animationDuration = 850; // elegantly paced movement
    let startTime: number | null = null;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      const animatedNodes = nodes.map((node) => {
        const start = startPositions[node.id] || { x: node.x, y: node.y };
        const target = targetPositions[node.id] || { x: node.x, y: node.y };

        return {
          ...node,
          // Interpolate coordinates smoothly
          x: Math.round(start.x + (target.x - start.x) * easedProgress),
          y: Math.round(start.y + (target.y - start.y) * easedProgress),
        };
      });

      onUpdateNodes(animatedNodes);

      if (progress < 1) {
        layoutAnimRef.current = requestAnimationFrame(animate);
      } else {
        layoutAnimRef.current = null;
      }
    };

    layoutAnimRef.current = requestAnimationFrame(animate);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    // Zoom factor
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoomScale * zoomFactor));

    if (newZoom !== zoomScale && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Coordinate in unscaled terms
      const gx = (mouseX - panX) / zoomScale;
      const gy = (mouseY - panY) / zoomScale;

      const newPanX = mouseX - gx * newZoom;
      const newPanY = mouseY - gy * newZoom;

      setZoomScale(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    }
  };

  // Canvas pan handling
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // If clicking a node, don't pan
    const target = e.target as SVGElement;
    if (target.closest('.node-element') || target.closest('.control-button')) {
      return;
    }
    setIsPanning(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    } else if (draggedNodeId) {
      // Node Dragging
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clientXOnCanvas = (e.clientX - rect.left - panX) / zoomScale;
      const clientYOnCanvas = (e.clientY - rect.top - panY) / zoomScale;

      const updated = nodes.map((node) => {
        if (node.id === draggedNodeId) {
          return {
            ...node,
            x: Math.round(clientXOnCanvas - nodeDragOffset.x),
            y: Math.round(clientYOnCanvas - nodeDragOffset.y),
          };
        }
        return node;
      });
      onUpdateNodes(updated);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);

    if (draggedNodeId && nodeClickStartRef.current) {
      const start = nodeClickStartRef.current;
      const dx = e.clientX - start.clientX;
      const dy = e.clientY - start.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - start.time;

      // Only perform selection if we did NOT drag significantly and it was a relatively short click
      if (dist < 6 && elapsed < 350) {
        onSelectNode(start.id);
      }
    }

    setDraggedNodeId(null);
    nodeClickStartRef.current = null;
  };

  // Node drag initiation
  const handleNodeMouseDown = (e: React.MouseEvent, node: EducationalNode) => {
    e.stopPropagation();
    
    // Cancel any active layout animation if user begins dragging
    if (layoutAnimRef.current !== null) {
      cancelAnimationFrame(layoutAnimRef.current);
      layoutAnimRef.current = null;
    }

    // Do not call onSelectNode(node.id) immediately on mousedown - we select on short click / mouse up instead
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clientXOnCanvas = (e.clientX - rect.left - panX) / zoomScale;
    const clientYOnCanvas = (e.clientY - rect.top - panY) / zoomScale;

    setDraggedNodeId(node.id);
    setNodeDragOffset({
      x: clientXOnCanvas - node.x,
      y: clientYOnCanvas - node.y,
    });

    // Record the mouse down details to distinguish clicks from drags
    nodeClickStartRef.current = {
      id: node.id,
      clientX: e.clientX,
      clientY: e.clientY,
      time: Date.now()
    };
  };

  // Type-specific colors
  const getTypeColors = (type: NodeType, isSelected: boolean) => {
    switch (type) {
      case 'person':
        return {
          bg: 'bg-indigo-50/95 dark:bg-indigo-950/40 backdrop-blur-sm',
          text: 'text-indigo-900 dark:text-indigo-200',
          border: isSelected ? 'border-indigo-600 dark:border-indigo-450 ring-2 ring-indigo-300 dark:ring-indigo-800' : 'border-indigo-200 dark:border-indigo-900 hover:border-indigo-400 dark:hover:border-indigo-700',
          tagBg: 'bg-indigo-100 dark:bg-indigo-900/65 text-indigo-800 dark:text-indigo-200',
          badge: '🎨 Person',
        };
      case 'theory':
        return {
          bg: 'bg-emerald-50/95 dark:bg-emerald-950/40 backdrop-blur-sm',
          text: 'text-emerald-900 dark:text-emerald-200',
          border: isSelected ? 'border-emerald-600 dark:border-emerald-450 ring-2 ring-emerald-300 dark:ring-emerald-800' : 'border-emerald-200 dark:border-emerald-900 hover:border-emerald-400 dark:hover:border-emerald-700',
          tagBg: 'bg-emerald-100 dark:bg-emerald-900/65 text-emerald-800 dark:text-emerald-200',
          badge: '⚡ Theory',
        };
      case 'concept':
        return {
          bg: 'bg-amber-50/95 dark:bg-amber-950/40 backdrop-blur-sm',
          text: 'text-amber-900 dark:text-amber-200',
          border: isSelected ? 'border-amber-600 dark:border-amber-450 ring-2 ring-amber-300 dark:ring-amber-800' : 'border-amber-200 dark:border-amber-900 hover:border-amber-400 dark:hover:border-amber-700',
          tagBg: 'bg-amber-100 dark:bg-amber-900/65 text-amber-800 dark:text-amber-200',
          badge: '💡 Concept',
        };
      case 'text':
        return {
          bg: 'bg-indigo-50/95 dark:bg-indigo-950/40 backdrop-blur-sm',
          text: 'text-indigo-900 dark:text-indigo-200',
          border: isSelected ? 'border-indigo-600 dark:border-indigo-450 ring-2 ring-indigo-300 dark:ring-indigo-800' : 'border-indigo-200 dark:border-indigo-900 hover:border-indigo-400 dark:hover:border-indigo-700',
          tagBg: 'bg-indigo-100 dark:bg-indigo-900/65 text-indigo-800 dark:text-indigo-200',
          badge: '📚 Text',
        };
    }
  };

  // Handle building new node
  const handleCreateNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    // Place new node roughly in the visible center of canvas
    const centerNodeX = Math.round((-panX + 300) / zoomScale);
    const centerNodeY = Math.round((-panY + 200) / zoomScale);

    const chronologicalValue = parseInt(newNodeChron.split('-')[0]) || 2000;

    const newNode: EducationalNode = {
      id: newNodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim(),
      type: newNodeType,
      name: newNodeName,
      description: newNodeDesc,
      details: newNodeDetails || 'A summary of study insights goes here as a reference material.',
      chronology: newNodeChron || '2026',
      chronologyVal: chronologicalValue,
      tags: newNodeTags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: newNodeImageUrl.trim() || undefined,
      nationality: newNodeType === 'person' ? (newNodeNationality.trim() || undefined) : undefined,
      x: isNaN(centerNodeX) ? 400 : centerNodeX + (Math.random() * 80 - 40),
      y: isNaN(centerNodeY) ? 250 : centerNodeY + (Math.random() * 80 - 40),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddNode(newNode);
    setIsAddNodeOpen(false);

    // Clear form
    setNewNodeName('');
    setNewNodeDesc('');
    setNewNodeDetails('');
    setNewNodeChron('');
    setNewNodeTags('');
    setNewNodeImageUrl('');
    setNewNodeNationality('');
  };

  // Handle building new relation
  const handleCreateRelationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relSourceId || !relTargetId || !relLabel.trim()) return;

    const newRel: NodeRelation = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sourceId: relSourceId,
      targetId: relTargetId,
      label: relLabel.trim().toLowerCase(),
      description: relDesc || `Connection link asserting that ${nodes.find(n => n.id === relSourceId)?.name} is linked to ${nodes.find(n => n.id === relTargetId)?.name}.`,
    };

    onAddRelation(newRel);
    setIsAddRelationOpen(false);

    // Clear fields
    setRelSourceId('');
    setRelTargetId('');
    setRelLabel('');
    setRelDesc('');
  };

  return (
    <div className="relative w-full h-full bg-neutral-100 dark:bg-neutral-950 flex flex-col select-none overflow-hidden transition-colors duration-250" id="viz-wrapper">
      {/* Topology Header Info */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
        {isHintVisible ? (
          <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm pl-4 pr-10 py-2.5 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-800 pointer-events-auto max-w-sm transition-colors duration-250 relative">
            <button
              onClick={() => setIsHintVisible(false)}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-neutral-405 hover:text-neutral-700 dark:hover:text-neutral-250 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Close panel hint"
              id="close-conceptmap-hint"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <h2 className="font-sans text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-neutral-600 dark:text-neutral-400" /> Interactive Knowledge Visualizer
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Drag nodes to map knowledge. Double click connections, add people, theories, concepts and build relationships dynamically.
            </p>
          </div>
        ) : (
          <div />
        )}

        {/* Floating Tool Controls & Search */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            {isReadOnly ? (
              <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-3.5 py-2 rounded-lg shadow-sm font-semibold select-none">
                <Lock className="w-3.5 h-3.5 text-neutral-400 animate-pulse" /> Read-Only Shared Mode
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsAddNodeOpen(true)}
                  id="btn-add-node"
                  className="flex items-center gap-1.5 bg-neutral-900 dark:bg-neutral-800 border border-neutral-800 dark:border-neutral-700 text-white hover:bg-neutral-800 dark:hover:bg-neutral-700 text-xs px-3.5 py-2 rounded-lg shadow-sm font-medium transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Select Node
                </button>
                <button
                  onClick={() => setIsAddRelationOpen(true)}
                  id="btn-add-relation"
                  className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs px-3.5 py-2 rounded-lg shadow-sm font-medium transition cursor-pointer"
                >
                  <Link className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" /> Draw Link
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Canvas Camera Controls */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-xl p-1.5 shadow-md flex items-center gap-1 z-10 text-neutral-800 dark:text-neutral-200 transition-colors duration-250">
        <button
          onClick={() => handleZoom(1.15)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 transition"
          title="Recenter Camera"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="px-2 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 font-medium">
          {Math.round(zoomScale * 100)}%
        </div>
        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
        <button
          onClick={handleAutoLayout}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-indigo-600 dark:text-indigo-400 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer select-none"
          title="Spread out nodes to be equidistant, connected nodes closer"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline font-sans text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Arrange Map</span>
        </button>
      </div>

      {/* Primary SVG Board */}
      <svg
        ref={svgRef}
        id="knowledge-canvas"
        className={`w-full h-full cursor-${isPanning ? 'grabbing' : draggedNodeId ? 'grabbing' : 'grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Arrow markers for linked lines */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX={10}
            refY={5}
            markerWidth={7}
            markerHeight={7}
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#a3a3a3" className="fill-neutral-400 dark:fill-neutral-600" />
          </marker>
          <marker
            id="arrow-selected"
            viewBox="0 0 10 10"
            refX={10}
            refY={5}
            markerWidth={8}
            markerHeight={8}
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#171717" className="fill-neutral-900 dark:fill-neutral-200" />
          </marker>
        </defs>

        {/* Master Camera Transformation Group */}
        <g 
          transform={`translate(${panX}, ${panY}) scale(${zoomScale})`}
          style={{ transition: isPanning || draggedNodeId ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        >
          {/* Grid Background pattern (dynamic infinite feel) */}
          <g>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e5e5" strokeWidth="0.5" className="stroke-neutral-200 dark:stroke-neutral-800/80" />
              </pattern>
            </defs>
            <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid)" pointerEvents="none" opacity="0.5" />
          </g>

          {/* Draw Connection Links / Line Relations first so they sit behind nodes */}
          {relations.map((rel) => {
            const source = nodes.find((n) => n.id === rel.sourceId);
            const target = nodes.find((n) => n.id === rel.targetId);

            if (!source || !target) return null;

            // Center of source node
            const sX = source.x + nodeWidth / 2;
            const sY = source.y + nodeHeight / 2;

            // Center of target node
            const tX = target.x + nodeWidth / 2;
            const tY = target.y + nodeHeight / 2;

            // Calculate directional intersection on target boundary to prevent lines from sliding behind cards
            const dx = tX - sX;
            const dy = tY - sY;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            // Scaled border distances
            const scaleX = dx / (len || 1);
            const scaleY = dy / (len || 1);
            
            // Adjust end position slightly so arrow meets edge properly
            const edgeOffsetX = scaleX * (nodeWidth / 2 + 10);
            const edgeOffsetY = scaleY * (nodeHeight / 2 + 10);
            
            const lineEndX = tX - edgeOffsetX;
            const lineEndY = tY - edgeOffsetY;

            // Midpoint of line for label placement
            const midX = sX + dx * 0.5;
            const midY = sY + dy * 0.5;

            // Selection state check
            const isSelectedRelation = selectedNodeId === source.id || selectedNodeId === target.id;

            return (
              <g key={rel.id} className="relation-element group">
                {/* Connecting Line */}
                <line
                  x1={sX}
                  y1={sY}
                  x2={lineEndX}
                  y2={lineEndY}
                  stroke={isSelectedRelation ? '#171717' : '#d4d4d4'}
                  strokeWidth={isSelectedRelation ? 2.5 : 1.5}
                  markerEnd={`url(#${isSelectedRelation ? 'arrow-selected' : 'arrow'})`}
                  strokeDasharray={isSelectedRelation ? undefined : '4,3'}
                  className={`transition-all duration-300 ${
                    isSelectedRelation 
                      ? 'stroke-neutral-900 dark:stroke-neutral-200' 
                      : 'stroke-neutral-300 dark:stroke-neutral-700'
                  }`}
                />

                {/* Connection Label Capsule */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-42}
                    y={-10}
                    width={84}
                    height={20}
                    rx={10}
                    fill="white"
                    stroke={isSelectedRelation ? '#171717' : '#e5e5e5'}
                    strokeWidth={isSelectedRelation ? 1.5 : 1}
                    className={`transition-all shadow-sm ${
                      isSelectedRelation
                        ? 'fill-white dark:fill-neutral-900 stroke-neutral-900 dark:stroke-neutral-200'
                        : 'fill-white dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800'
                    }`}
                  />
                  <text
                    textAnchor="middle"
                    y={3.5}
                    fontSize={10}
                    fontFamily="monospace"
                    className={`font-medium transition-all ${
                      isSelectedRelation 
                        ? 'fill-neutral-900 dark:fill-neutral-100 font-bold' 
                        : 'fill-neutral-500 dark:fill-neutral-400'
                    }`}
                  >
                    {rel.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Draw Nodes (Interactive Cards) */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const cfg = getTypeColors(node.type, isSelected);
            
            const isMatch = searchQuery ? (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || node.description.toLowerCase().includes(searchQuery.toLowerCase())) : true;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                className={`node-element group cursor-grab active:cursor-grabbing transition-opacity duration-300 ${!isMatch ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}
              >
                {/* Visual shadow block */}
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={12}
                  fill="transparent"
                  className={`transition-all duration-200 ${
                    isSelected 
                      ? 'stroke-neutral-800 stroke-2 [filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.12))] dark:stroke-white dark:[filter:drop-shadow(0_8px_16px_rgba(255,255,255,0.12))]' 
                      : searchQuery && isMatch
                      ? 'stroke-indigo-500 stroke-[4px] [filter:drop-shadow(0_0px_20px_rgba(99,102,241,0.8))]'
                      : 'hover:[filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.06))]'
                  }`}
                />

                {/* Card Container HTML injected via ForeignObject for responsive Tailwind layouts */}
                <foreignObject width={nodeWidth} height={nodeHeight} rx={12} className="pointer-events-none">
                  <div
                    className={`w-full h-full border ${cfg.border} ${cfg.bg} rounded-xl p-2.5 flex items-stretch gap-2 transition-all duration-200 select-none`}
                  >
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[8.5px] font-mono font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 truncate">
                            {cfg.badge}
                          </span>
                          <span className="text-[8.5px] font-medium font-mono text-neutral-500 dark:text-neutral-450 bg-white/60 dark:bg-neutral-800/60 px-1 py-0.2 rounded border border-neutral-100 dark:border-neutral-800 shrink-0">
                            {node.chronology}
                          </span>
                        </div>
                        <h3 className={`font-sans font-semibold text-xs mt-0.5 text-neutral-900 dark:text-white leading-tight w-full truncate`}>
                          {node.name}
                        </h3>
                      </div>

                      <p className="text-[9.5px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                        {node.description}
                      </p>
                    </div>

                    {node.imageUrl && (
                      <div className="w-11 rounded-lg bg-white/60 dark:bg-neutral-900/60 overflow-hidden flex-shrink-0 border border-neutral-200/50 dark:border-neutral-800/50 self-center flex flex-col items-center justify-center aspect-square shadow-2xs">
                        <img
                          src={node.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Modal - Add Node */}
      <AnimatePresence>
        {isAddNodeOpen && (
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-105 transition-colors duration-200"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
                <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-50 text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-neutral-500" /> Create New Educational Node
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddNodeOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNodeSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(['person', 'theory', 'concept', 'text'] as NodeType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewNodeType(t)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold uppercase capitalize transition text-center cursor-pointer ${
                        newNodeType === t
                          ? 'border-neutral-900 dark:border-neutral-600 bg-neutral-900 dark:bg-neutral-800 text-white'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">NAME</label>
                  <input
                    type="text"
                    required
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder="e.g. Jean Piaget, Zone of Proximal Development..."
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">CHRONOLOGY / YEAR</label>
                    <input
                      type="text"
                      required
                      value={newNodeChron}
                      onChange={(e) => setNewNodeChron(e.target.value)}
                      placeholder="e.g. 1896-1980, 1934"
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={newNodeTags}
                      onChange={(e) => setNewNodeTags(e.target.value)}
                      placeholder="e.g. cognitive, swiss, learning"
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">BRIEF DESCRIPTION</label>
                  <input
                    type="text"
                    required
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    placeholder="Provide a quick one-liner overview"
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                  />
                </div>

                {newNodeType === 'person' && (
                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">NATIONALITY (OPTIONAL)</label>
                    <input
                      type="text"
                      value={newNodeNationality}
                      onChange={(e) => setNewNodeNationality(e.target.value)}
                      placeholder="e.g. Swiss, Soviet, Canadian-American"
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">ATTACHED IMAGE URL (OPTIONAL)</label>
                  <input
                    type="text"
                    value={newNodeImageUrl}
                    onChange={(e) => setNewNodeImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">EXTENSIVE DETAILS (RICH REFERENCE STUDY NOTES)</label>
                  <textarea
                    rows={3}
                    value={newNodeDetails}
                    onChange={(e) => setNewNodeDetails(e.target.value)}
                    placeholder="Detailed explanations, milestones, core critiques, or developmental details."
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddNodeOpen(false)}
                    className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-neutral-950 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-750 text-white font-medium text-xs py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Add to Map
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Add Relation Link */}
      <AnimatePresence>
        {isAddRelationOpen && (
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-105 transition-colors duration-200"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
                <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-50 text-base flex items-center gap-2">
                  <Link className="w-5 h-5 text-neutral-500" /> Draw Relationship Connection
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddRelationOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-350 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRelationSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">SOURCE NODE</label>
                    <select
                      required
                      value={relSourceId}
                      onChange={(e) => setRelSourceId(e.target.value)}
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                    >
                      <option value="" className="dark:bg-neutral-900">Select subject...</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id} className="dark:bg-neutral-900">{n.name} ({n.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-5">
                    <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
                  </div>

                  <div className="col-start-1 col-end-3">
                    <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">TARGET NODE</label>
                    <select
                      required
                      value={relTargetId}
                      onChange={(e) => setRelTargetId(e.target.value)}
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100"
                    >
                      <option value="" className="dark:bg-neutral-900">Select connection recipient...</option>
                      {nodes
                        .filter((n) => n.id !== relSourceId)
                        .map((n) => (
                          <option key={n.id} value={n.id} className="dark:bg-neutral-900">{n.name} ({n.type})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">RELATION LABEL</label>
                  <input
                    type="text"
                    required
                    value={relLabel}
                    onChange={(e) => setRelLabel(e.target.value)}
                    placeholder="e.g. formulated, supports, critiques, works-within..."
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400 mb-1">CONNECTION DESCRIPTION / CONTEXT</label>
                  <textarea
                    rows={3}
                    value={relDesc}
                    onChange={(e) => setRelDesc(e.target.value)}
                    placeholder="Explain how these two entities relate contextually..."
                    className="w-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white focus:outline-none bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddRelationOpen(false)}
                    className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-neutral-950 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-750 text-white font-medium text-xs py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Link Entities
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
