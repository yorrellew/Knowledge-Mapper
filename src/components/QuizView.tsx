/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EducationalNode, NodeRelation, QuizQuestion, QuizState } from '../types';
import { Sparkles, Trophy, RotateCcw, Check, X, HelpCircle, ArrowRight, Award, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizViewProps {
  nodes: EducationalNode[];
  relations: NodeRelation[];
}

export default function QuizView({ nodes, relations }: QuizViewProps) {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  // Helper: Shuffle Array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Generate dynamic quiz questions based on active database nodes
  const generateQuiz = () => {
    if (nodes.length < 4) {
      setQuizState(null);
      return;
    }

    const generatedQuestions: QuizQuestion[] = [];
    const allNodeNames = nodes.map(n => n.name);

    // 1. Definition Questions (Generate up to 3)
    const definitionNodes = shuffleArray(nodes).slice(0, 3);
    definitionNodes.forEach((node) => {
      // Find 3 incorrect names
      const distractors = shuffleArray(allNodeNames.filter(name => name !== node.name)).slice(0, 3);
      const options = shuffleArray([node.name, ...distractors]);

      generatedQuestions.push({
        id: `q-def-${node.id}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'definition',
        question: `Which educator, theory, or concept matches this description?\n\n"${node.description}"`,
        options,
        correctAnswer: node.name,
        explanation: `${node.name} (${node.type}) is known for: ${node.details}`,
        nodeId: node.id
      });
    });

    // 2. Relationship Questions (using links, up to 3)
    if (relations.length > 0) {
      const activeRelations = shuffleArray(relations).slice(0, 3);
      activeRelations.forEach((rel) => {
        const sourceNode = nodes.find(n => n.id === rel.sourceId);
        const targetNode = nodes.find(n => n.id === rel.targetId);

        if (sourceNode && targetNode) {
          // Find distractor labels
          const possibleLabels = Array.from(new Set(relations.map(r => r.label)));
          const defaultLabels = ['formulated', 'supports', 'critiques', 'defined', 'contains', 'inspired', 'developed'];
          const combinedLabels = Array.from(new Set([...possibleLabels, ...defaultLabels]));
          
          const distractors = shuffleArray(combinedLabels.filter(l => l !== rel.label)).slice(0, 3);
          const options = shuffleArray([rel.label, ...distractors]);

          generatedQuestions.push({
            id: `q-rel-${rel.id}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'relationship',
            question: `In the mapped cognitive landscape, what is the connection or relation between "${sourceNode.name}" and "${targetNode.name}"?`,
            options,
            correctAnswer: rel.label,
            explanation: `Our knowledge schema asserts: "${sourceNode.name}" ${rel.label} "${targetNode.name}". Context: ${rel.description}`,
            nodeId: sourceNode.id
          });
        }
      });
    }

    // 3. Chronology Questions (up to 2)
    const chronoNodes = shuffleArray(nodes.filter(n => n.chronology)).slice(0, 2);
    chronoNodes.forEach((node) => {
      const distractors = shuffleArray(
        nodes
          .filter(n => n.id !== node.id && n.chronology)
          .map(n => n.chronology)
      ).slice(0, 3);

      // Pad custom options if not enough nodes
      while (distractors.length < 3) {
        distractors.push(`${Math.floor(Math.random() * 100 + 1900)} - ${Math.floor(Math.random() * 100 + 1950)}`);
      }

      const options = shuffleArray([node.chronology, ...distractors]);

      generatedQuestions.push({
        id: `q-chrono-${node.id}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'chronology',
        question: `What is the active chronological context or timeframe associated with "${node.name}"?`,
        options,
        correctAnswer: node.chronology,
        explanation: `${node.name} is categorized in the timeline for the period: ${node.chronology}.`,
        nodeId: node.id
      });
    });

    // Final Shuffle questions list
    const finalQuestions = shuffleArray(generatedQuestions).slice(0, 6); // Limit to 6 questions max

    setQuizState({
      questions: finalQuestions,
      currentIndex: 0,
      score: 0,
      answers: {},
      isFinished: false
    });
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  useEffect(() => {
    generateQuiz();
  }, [nodes, relations]);

  if (nodes.length < 4) {
    return (
      <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-8 flex flex-col justify-center items-center text-center self-center transition-colors" id="empty-quiz">
        <HelpCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-600 animate-bounce" />
        <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-200 text-base mt-4 select-none">Database Compilation Required</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1.5 leading-relaxed font-normal">
          We need at least 4 custom people, theories, or concepts mapped on the canvas to generate dynamic multiple-choice distractors. Add more items to compile the assessment!
        </p>
      </div>
    );
  }

  if (!quizState) return null;

  const { questions, currentIndex, score, isFinished } = quizState;
  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer || isAnswered) return;
    setIsAnswered(true);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setQuizState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        answers: { ...prev.answers, [currentQuestion.id]: selectedAnswer }
      };
    });
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (currentIndex + 1 >= questions.length) {
      setQuizState((prev) => {
        if (!prev) return prev;
        return { ...prev, isFinished: true };
      });
    } else {
      setQuizState((prev) => {
        if (!prev) return prev;
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      });
    }
  };

  return (
    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col overflow-y-auto transition-colors" id="quiz-wrapper">
      {/* Quiz Board Wrapper */}
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center py-6">
        
        <AnimatePresence mode="wait">
          {!isFinished ? (
            /* ACTIVE QUESTION PANEL */
            <motion.div
              key={currentQuestion.id}
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-lg flex flex-col space-y-6"
            >
              {/* Question Header Status */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-400 dark:text-neutral-500">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-955 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800">
                  CRITERIA: {currentQuestion.type}
                </span>
              </div>

              {/* Question description */}
              <div>
                <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-100 text-lg sm:text-xl leading-snug whitespace-pre-line">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options selection stack */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === currentQuestion.correctAnswer;

                  // Styling logic post grading
                  let optionStyle = 'border-neutral-200/85 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-855 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-200';
                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold';
                    } else if (isSelected) {
                      optionStyle = 'border-rose-300 bg-rose-50 dark:bg-rose-955/20 text-rose-800 dark:text-rose-300';
                    } else {
                      optionStyle = 'border-neutral-100 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 text-neutral-400 dark:text-neutral-600 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-neutral-950 dark:border-white bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-medium shadow-md';
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectAnswer(option)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-2xl border text-left text-sm transition duration-150 select-none cursor-pointer flex items-center justify-between ${optionStyle}`}
                    >
                      <span className="pr-4">{option}</span>
                      {isAnswered && isCorrectAnswer && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrectAnswer && (
                        <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action and Explanatory feedback box */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal"
                    >
                      <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300 tracking-wider block uppercase mb-1 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4 text-neutral-500" /> Explanation Details
                      </span>
                      {currentQuestion.explanation}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end">
                  {!isAnswered ? (
                    <button
                      onClick={handleConfirmAnswer}
                      disabled={!selectedAnswer}
                      className={`px-5 py-3 rounded-xl font-semibold text-xs tracking-wide uppercase transition cursor-pointer ${
                        selectedAnswer
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-900 border border-neutral-900'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-800 cursor-not-allowed'
                      }`}
                    >
                      Answer Fact
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-3 rounded-xl bg-neutral-950 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-700 text-white font-semibold text-xs tracking-wide uppercase transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {currentIndex + 1 < questions.length ? 'Continue' : 'Compile Results'}{' '}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* COMPREHENSIVE QUIZ RESULTS SCORE */
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-xl text-center flex flex-col items-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-neutral-950 dark:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-white p-2">
                <Trophy className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <h3 className="font-sans font-bold text-neutral-800 dark:text-neutral-100 text-2xl tracking-tight leading-tight">
                  Assessment Completed
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 uppercase font-mono font-bold tracking-wider">
                  dynamic memory recall score
                </p>
              </div>

              {/* Interactive Score Block */}
              <div className="bg-neutral-50 dark:bg-neutral-955 border border-neutral-200 dark:border-neutral-800 rounded-3xl py-6 px-10">
                <span className="text-neutral-900 dark:text-white font-bold text-5xl font-mono">
                  {score}
                </span>
                <span className="text-neutral-400 text-2xl font-mono font-light">
                  {' '}/ {questions.length}
                </span>
                <p className="text-[10px] font-sans font-semibold text-neutral-500 dark:text-neutral-400 mt-2">
                  {score === questions.length
                    ? 'Perfect! Complete structural consolidation achieved.'
                    : score >= questions.length / 2
                    ? 'Decent understanding. Retake map paths to verify gaps!'
                    : 'Review material nodes via Flashcards to adjust schemas.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={generateQuiz}
                  className="px-5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-905 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 text-neutral-500" /> New Random Shuffle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
