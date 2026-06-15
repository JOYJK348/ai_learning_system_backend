'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle,
  Star, Zap,
  Map as MapIcon,
  Lock, Volume2, Play, RotateCcw
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { audioEngine } from '@/core/utils/audio';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { studentApi, studentKeys, type Chapter, type Lesson } from '@/core/services/studentApi';
import ActivityPlayer from '../_components/activities/ActivityPlayer';
import NameTraceActivity from '../_components/activities/NameTraceActivity';
import TraceActivity from '../_components/activities/TraceActivity';
import PreWritingVideo from '../_components/activities/PreWritingVideo';
import LetterCheckpoint from '../_components/activities/LetterCheckpoint';


/* ─────────── VISUAL HELPERS FOR TODDLERS ─────────── */
function getChapterVisuals(name: string) {
  const lower = name.toLowerCase();
  // Specific matches first (most specific → least specific)
  if (lower.includes('checkpoint'))
    return { emoji: '🏁', mascot: '🎯', color: 'from-violet-400 to-purple-500', sound: 'Checkpoint time!' };
  if (lower.includes('final') || lower.includes('assessment'))
    return { emoji: '📖', mascot: '🧚', color: 'from-violet-400 to-purple-500', sound: 'Story time!' };
  if (lower.includes('rhymes & songs'))
    return { emoji: '🎤', mascot: '🎶', color: 'from-pink-400 to-rose-500', sound: 'Sing along!' };
  if (lower.includes('rhyme'))
    return { emoji: '🎵', mascot: '🎙️', color: 'from-red-400 to-pink-500', sound: 'Rhyme time!' };
  if (lower.includes('small') && lower.includes('letter') && (lower.includes('phonics') || (lower.includes('small') && lower.includes('a-m'))))
    return { emoji: '🐝', mascot: '🔤', color: 'from-teal-400 to-cyan-500', sound: 'Phonics time!' };
  if (lower.includes('phonics'))
    return { emoji: '🐝', mascot: '🔤', color: 'from-teal-400 to-cyan-500', sound: 'Phonics time!' };
  if (lower.includes('recognition'))
    return { emoji: '🔍', mascot: '👀', color: 'from-sky-400 to-blue-500', sound: 'Find the letter!' };
  if (lower.includes('letters a-m') || lower.includes('letters a') || lower.includes('a-m'))
    return { emoji: '🍎', mascot: '🅰️', color: 'from-red-400 to-rose-500', sound: 'A to M!' };
  if (lower.includes('letters n-z') || lower.includes('letters n') || lower.includes('n-z'))
    return { emoji: '🦓', mascot: '🆉', color: 'from-indigo-400 to-violet-500', sound: 'N to Z!' };
  if (lower.includes('alphabet'))
    return { emoji: '🔤', mascot: '🔡', color: 'from-blue-400 to-purple-500', sound: 'Alphabets!' };
  if (lower.includes('letter'))
    return { emoji: '🔤', mascot: '🔠', color: 'from-blue-400 to-indigo-500', sound: 'Letters time!' };
  if (lower.includes('reading'))
    return { emoji: '📚', mascot: '📖', color: 'from-amber-400 to-yellow-500', sound: 'Read with me!' };
  if (lower.includes('grammar'))
    return { emoji: '📝', mascot: '✏️', color: 'from-lime-400 to-green-500', sound: 'Grammar time!' };
  if (lower.includes('multiplication'))
    return { emoji: '✖️', mascot: '🔢', color: 'from-orange-400 to-red-500', sound: 'Multiply!' };
  if (lower.includes('addition') || lower.includes('subtraction'))
    return { emoji: '➕', mascot: '🧮', color: 'from-orange-400 to-amber-500', sound: 'Add and subtract!' };
  if (lower.includes('number') || lower.includes('count') || lower.includes('math'))
    return { emoji: '🔢', mascot: '🧮', color: 'from-orange-400 to-amber-500', sound: 'Number time!' };
  if (lower.includes('science'))
    return { emoji: '🔬', mascot: '🧪', color: 'from-cyan-400 to-blue-500', sound: 'Science time!' };
  if (lower.includes('environment'))
    return { emoji: '🌍', mascot: '🌿', color: 'from-emerald-400 to-green-500', sound: 'Our world!' };
  if (lower.includes('pre-writing') || lower.includes('writing') || lower.includes('line'))
    return { emoji: '🖍️', mascot: '✍️', color: 'from-amber-400 to-orange-500', sound: 'Writing time!' };
  if (lower.includes('shape'))
    return { emoji: '🔺', mascot: '⭕', color: 'from-emerald-400 to-teal-500', sound: 'Shapes!' };
  if (lower.includes('color'))
    return { emoji: '🎨', mascot: '🖍️', color: 'from-purple-400 to-fuchsia-500', sound: 'Colors!' };
  if (lower.includes('animal'))
    return { emoji: '🦁', mascot: '🐘', color: 'from-green-400 to-emerald-500', sound: 'Animals!' };
  if (lower.includes('fruit'))
    return { emoji: '🍎', mascot: '🍌', color: 'from-red-400 to-orange-500', sound: 'Fruits!' };
  if (lower.includes('flower') || lower.includes('plant'))
    return { emoji: '🌸', mascot: '🌻', color: 'from-pink-400 to-yellow-400', sound: 'Flowers!' };
  if (lower.includes('cvc'))
    return { emoji: '🐱', mascot: '🐱', color: 'from-orange-400 to-red-500', sound: 'CVC words!' };
  if (lower.includes('name'))
    return { emoji: '✏️', mascot: '👤', color: 'from-pink-400 to-purple-500', sound: 'Write your name!' };
  return { emoji: '📖', mascot: '📚', color: 'from-indigo-400 to-purple-500', sound: `${name}!` };
}

const WORD_VISUALS: Record<string, { emoji: string; mascot: string; color: string; sound: string }> = {
  apple: { emoji: '🍎', mascot: '🍎', color: 'from-red-400 to-rose-500', sound: 'Apple!' },
  ball: { emoji: '🏀', mascot: '⚽', color: 'from-orange-400 to-amber-500', sound: 'Ball!' },
  cat: { emoji: '🐱', mascot: '🐱', color: 'from-yellow-400 to-amber-500', sound: 'Cat! Meow!' },
  dog: { emoji: '🐶', mascot: '🐶', color: 'from-amber-400 to-yellow-500', sound: 'Dog! Woof!' },
  elephant: { emoji: '🐘', mascot: '🐘', color: 'from-gray-400 to-slate-500', sound: 'Elephant!' },
  fish: { emoji: '🐟', mascot: '🐟', color: 'from-blue-400 to-cyan-500', sound: 'Fish! Swim swim!' },
  grapes: { emoji: '🍇', mascot: '🍇', color: 'from-purple-400 to-violet-500', sound: 'Grapes!' },
  hat: { emoji: '🎩', mascot: '🎩', color: 'from-pink-400 to-rose-500', sound: 'Hat!' },
  'ice cream': { emoji: '🍦', mascot: '🍦', color: 'from-pink-400 to-purple-500', sound: 'Ice cream!' },
  jug: { emoji: '🏺', mascot: '🏺', color: 'from-indigo-400 to-blue-500', sound: 'Jug!' },
  kite: { emoji: '🪁', mascot: '🪁', color: 'from-violet-400 to-fuchsia-500', sound: 'Kite!' },
  lion: { emoji: '🦁', mascot: '🦁', color: 'from-orange-400 to-red-500', sound: 'Lion! Roar!' },
  mango: { emoji: '🥭', mascot: '🥭', color: 'from-yellow-400 to-orange-500', sound: 'Mango!' },
  monkey: { emoji: '🐵', mascot: '🐵', color: 'from-amber-400 to-yellow-500', sound: 'Monkey!' },
  nest: { emoji: '🪹', mascot: '🪺', color: 'from-amber-400 to-emerald-500', sound: 'Nest!' },
  orange: { emoji: '🍊', mascot: '🍊', color: 'from-orange-400 to-red-500', sound: 'Orange!' },
  parrot: { emoji: '🦜', mascot: '🦜', color: 'from-green-400 to-emerald-500', sound: 'Parrot!' },
  queen: { emoji: '👸', mascot: '👑', color: 'from-purple-400 to-pink-500', sound: 'Queen!' },
  rabbit: { emoji: '🐰', mascot: '🐰', color: 'from-pink-400 to-purple-500', sound: 'Rabbit!' },
  sun: { emoji: '☀️', mascot: '☀️', color: 'from-yellow-400 to-amber-500', sound: 'Sun!' },
  tiger: { emoji: '🐯', mascot: '🐯', color: 'from-orange-400 to-amber-500', sound: 'Tiger!' },
  umbrella: { emoji: '☂️', mascot: '☂️', color: 'from-blue-400 to-cyan-500', sound: 'Umbrella!' },
  van: { emoji: '🚐', mascot: '🚐', color: 'from-sky-400 to-blue-500', sound: 'Van!' },
  watch: { emoji: '⌚', mascot: '⌚', color: 'from-gray-400 to-slate-500', sound: 'Watch!' },
  xylophone: { emoji: '🎹', mascot: '🎶', color: 'from-rainbow-400 to-purple-500', sound: 'Xylophone!' },
  yak: { emoji: '🦬', mascot: '🐃', color: 'from-brown-400 to-amber-500', sound: 'Yak!' },
  zebra: { emoji: '🦓', mascot: '🦓', color: 'from-gray-400 to-slate-500', sound: 'Zebra!' },
  hen: { emoji: '🐔', mascot: '🐔', color: 'from-amber-400 to-orange-500', sound: 'Hen!' },
};

function getLessonVisuals(title: string) {
  const lower = title.toLowerCase();

  // Extract word from "Letter X - Word" pattern for themed thumbnails
  const letterWordMatch = lower.match(/^letter\s+[a-z]\s*-\s*(.+)/);
  if (letterWordMatch) {
    const word = letterWordMatch[1].trim();
    const visuals = WORD_VISUALS[word];
    if (visuals) return visuals;
  }

  // Small Letters a-m
  if (lower.includes('small letters') && lower.includes('a-m'))
    return { emoji: '🍎', mascot: '🅰️', color: 'from-red-400 to-rose-500', sound: 'Small letters a to m!' };
  // Small Letters n-z  
  if (lower.includes('small letters') && lower.includes('n-z'))
    return { emoji: '🦓', mascot: '🆉', color: 'from-indigo-400 to-violet-500', sound: 'Small letters n to z!' };

  // Phonics: at, am, an
  if (lower.includes('phonics') && (lower.includes('at') || lower.includes('am') || lower.includes('an')) && !lower.includes('it') && !lower.includes('in') && !lower.includes('ig') && !lower.includes('op') && !lower.includes('ot') && !lower.includes('og'))
    return { emoji: '🐱', mascot: '🐱', color: 'from-orange-400 to-red-500', sound: 'at words like cat!' };
  // Phonics: it, in, ig
  if (lower.includes('phonics') && (lower.includes('it') || lower.includes('in') || lower.includes('ig')))
    return { emoji: '🐷', mascot: '🐷', color: 'from-pink-400 to-purple-500', sound: 'it words like pig!' };
  // Phonics: op, ot, og
  if (lower.includes('phonics') && (lower.includes('op') || lower.includes('ot') || lower.includes('og')))
    return { emoji: '🐶', mascot: '🐶', color: 'from-amber-400 to-yellow-500', sound: 'og words like dog!' };
  // Phonics: un, ut, ub
  if (lower.includes('phonics') && (lower.includes('un') || lower.includes('ut') || lower.includes('ub')))
    return { emoji: '☀️', mascot: '☀️', color: 'from-yellow-400 to-orange-500', sound: 'un words like sun!' };

  // CVC words
  if (lower.includes('cvc') && lower.includes('cat'))
    return { emoji: '🐱', mascot: '🐱', color: 'from-orange-400 to-red-500', sound: 'CVC words like cat!' };
  if (lower.includes('cvc') && lower.includes('dog'))
    return { emoji: '🐶', mascot: '🐶', color: 'from-amber-400 to-yellow-500', sound: 'CVC words like dog!' };

  // My Name Writing
  if (lower.includes('name') || lower.includes('name writing'))
    return { emoji: '✏️', mascot: '👤', color: 'from-pink-400 to-purple-500', sound: 'Write your name!' };

  // Pre-writing lines
  if (lower.includes('standing')) {
    return { emoji: '📏', mascot: '↕️', color: 'from-blue-400 to-indigo-500', sound: 'Standing line! Up and down!' };
  }
  if (lower.includes('sleeping')) {
    return { emoji: '🛏️', mascot: '↔️', color: 'from-emerald-400 to-teal-500', sound: 'Sleeping line! Left to right!' };
  }
  if (lower.includes('slanting')) {
    return { emoji: '📐', mascot: '↗️', color: 'from-orange-400 to-amber-500', sound: 'Slanting line!' };
  }
  if (lower.includes('curved') || lower.includes('curve')) {
    return { emoji: '🌈', mascot: '〰️', color: 'from-purple-400 to-pink-500', sound: 'Curved line! Like a rainbow!' };
  }
  if (lower.includes('zig') || lower.includes('zag')) {
    return { emoji: '⚡', mascot: '〽️', color: 'from-yellow-400 to-orange-500', sound: 'Zig zag line! Like lightning!' };
  }
  // Pre-Writing Exam
  if (lower.includes('exam'))
    return { emoji: '🎓', mascot: '📝', color: 'from-red-400 to-rose-500', sound: 'Exam time!' };
  if (lower.includes('letter') || /^[a-z]$/.test(lower)) {
    return { emoji: '🔤', mascot: '🔠', color: 'from-blue-400 to-indigo-500', sound: `Letter ${title}!` };
  }
  // Numbers
  if (lower.includes('number') || /\d/.test(lower)) {
    return { emoji: '🔢', mascot: '🧮', color: 'from-orange-400 to-amber-500', sound: `Number ${title}!` };
  }
  // Colors
  if (lower.includes('red')) return { emoji: '🎨', mascot: '🔴', color: 'from-red-400 to-rose-500', sound: 'Red color!' };
  if (lower.includes('blue')) return { emoji: '🎨', mascot: '🔵', color: 'from-blue-400 to-cyan-500', sound: 'Blue color!' };
  if (lower.includes('green')) return { emoji: '🎨', mascot: '🟢', color: 'from-green-400 to-emerald-500', sound: 'Green color!' };
  if (lower.includes('yellow')) return { emoji: '🎨', mascot: '🟡', color: 'from-yellow-400 to-amber-500', sound: 'Yellow color!' };
  if (lower.includes('color')) return { emoji: '🎨', mascot: '🖍️', color: 'from-purple-400 to-fuchsia-500', sound: 'Colors!' };
  // Shapes
  if (lower.includes('circle')) return { emoji: '🔺', mascot: '⭕', color: 'from-red-400 to-orange-500', sound: 'Circle!' };
  if (lower.includes('square')) return { emoji: '🔺', mascot: '⬜', color: 'from-blue-400 to-indigo-500', sound: 'Square!' };
  if (lower.includes('triangle')) return { emoji: '🔺', mascot: '🔺', color: 'from-yellow-400 to-orange-500', sound: 'Triangle!' };
  if (lower.includes('shape')) return { emoji: '🔺', mascot: '⭐', color: 'from-emerald-400 to-teal-500', sound: 'Shapes!' };
  // Animals
  if (lower.includes('cat')) return { emoji: '🐾', mascot: '🐱', color: 'from-orange-400 to-amber-500', sound: 'Cat!' };
  if (lower.includes('dog')) return { emoji: '🐾', mascot: '🐶', color: 'from-amber-400 to-yellow-500', sound: 'Dog!' };
  if (lower.includes('lion')) return { emoji: '🐾', mascot: '🦁', color: 'from-orange-400 to-red-500', sound: 'Lion!' };
  if (lower.includes('elephant')) return { emoji: '🐾', mascot: '🐘', color: 'from-gray-400 to-slate-500', sound: 'Elephant!' };
  if (lower.includes('bird')) return { emoji: '🐾', mascot: '🐦', color: 'from-sky-400 to-blue-500', sound: 'Bird!' };
  if (lower.includes('fish')) return { emoji: '🐾', mascot: '🐟', color: 'from-blue-400 to-cyan-500', sound: 'Fish!' };
  // Fruits
  if (lower.includes('apple')) return { emoji: '🍎', mascot: '🍎', color: 'from-red-400 to-rose-500', sound: 'Apple!' };
  if (lower.includes('banana')) return { emoji: '🍌', mascot: '🍌', color: 'from-yellow-400 to-amber-500', sound: 'Banana!' };
  if (lower.includes('mango')) return { emoji: '🥭', mascot: '🥭', color: 'from-orange-400 to-yellow-500', sound: 'Mango!' };
  if (lower.includes('grapes')) return { emoji: '🍇', mascot: '🍇', color: 'from-purple-400 to-violet-500', sound: 'Grapes!' };
  return { emoji: '📚', mascot: '📖', color: 'from-indigo-400 to-purple-500', sound: `${title}!` };
}

/* ─────────── SUBJECT VISUALS FOR TODDLERS ─────────── */
function getSubjectVisuals(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('english')) {
    return {
      emoji: '🔤',
      mascot: '📚',
      color: 'from-blue-400 via-indigo-400 to-purple-400',
      border: 'border-blue-300',
      bg: 'bg-blue-400/20',
      shadow: 'shadow-blue-500/20',
      sound: 'English! A B C!',
      label: 'ABC',
    };
  }
  if (lower.includes('math') || lower.includes('ganith')) {
    return {
      emoji: '🔢',
      mascot: '🧮',
      color: 'from-orange-400 via-amber-400 to-yellow-400',
      border: 'border-orange-300',
      bg: 'bg-orange-400/20',
      shadow: 'shadow-orange-500/20',
      sound: 'Numbers! One Two Three!',
      label: '123',
    };
  }
  if (lower.includes('environment') || lower.includes('evs') || lower.includes('science')) {
    return {
      emoji: '🌍',
      mascot: '🌳',
      color: 'from-emerald-400 via-green-400 to-teal-400',
      border: 'border-emerald-300',
      bg: 'bg-emerald-400/20',
      shadow: 'shadow-emerald-500/20',
      sound: 'Nature! Trees and Animals!',
      label: 'Nature',
    };
  }
  if (lower.includes('general') || lower.includes('gk') || lower.includes('knowledge')) {
    return {
      emoji: '🧠',
      mascot: '🌟',
      color: 'from-purple-400 via-violet-400 to-fuchsia-400',
      border: 'border-purple-300',
      bg: 'bg-purple-400/20',
      shadow: 'shadow-purple-500/20',
      sound: 'Knowledge! Stars and Planets!',
      label: 'GK',
    };
  }
  if (lower.includes('hindi')) {
    return {
      emoji: '🇮🇳',
      mascot: 'ह',
      color: 'from-rose-400 via-red-400 to-orange-400',
      border: 'border-rose-300',
      bg: 'bg-rose-400/20',
      shadow: 'shadow-rose-500/20',
      sound: 'Hindi! Ka Kha Ga!',
      label: 'हिंदी',
    };
  }
  if (lower.includes('tamil')) {
    return {
      emoji: '🇮🇳',
      mascot: 'த',
      color: 'from-cyan-400 via-sky-400 to-blue-400',
      border: 'border-cyan-300',
      bg: 'bg-cyan-400/20',
      shadow: 'shadow-cyan-500/20',
      sound: 'Tamil! அ ஆ இ!',
      label: 'தமிழ்',
    };
  }
  return {
    emoji: '🎒',
    mascot: '📖',
    color: 'from-pink-400 via-rose-400 to-orange-400',
    border: 'border-pink-300',
    bg: 'bg-pink-400/20',
    shadow: 'shadow-pink-500/20',
    sound: `${name} Time!`,
    label: name,
  };
}

/* ─────────── TUTORIAL STEP BUILDER ─────────── */

type TutorialStep = {
  title: string;
  speak: string;
  emoji: string;
  text?: string;
  anim?: 'bounce' | 'pop' | 'spin' | 'wiggle' | 'float' | 'pulse' | 'swing' | 'shake' | 'jump';
  word?: string;   // word to show in big letters for phonics
  family?: string; // word family to highlight (e.g. "at", "an", "it", "og")
};

function buildTutorial(title: string, studentName?: string): TutorialStep[] {
  const t = title.trim();
  const lower = t.toLowerCase();

  // Pre-writing strokes — LKG teacher style: action + repetition + fun
  if (lower.includes('standing')) {
    return [
      { title: "Let's learn Standing Line!", speak: "Yay! Let's learn Standing Line! Standing line... standing up tall!", emoji: '📏', anim: 'pop' },
      { title: 'Up goes the line!', speak: "Standing line goes up up up! Like an arrow to the sky!", emoji: '⬆️', anim: 'jump' },
      { title: 'Down comes the line!', speak: "Now it zooms down! From the top all the way to the ground!", emoji: '⬇️', anim: 'bounce' },
      { title: 'Like a tall tree!', speak: "See the tall tree standing straight and tall? That's a Standing Line!", emoji: '🌲', anim: 'float' },
      { title: 'Like a pencil!', speak: "A pencil standing up tall on your desk! Straight and strong! Standing Line!", emoji: '✏️', anim: 'wiggle' },
      { title: 'Draw it with me!', speak: "Take your finger, draw from top to bottom! Standing Line! One more time!", emoji: '📐', anim: 'pulse' },
      { title: 'You nailed it!', speak: "You mastered Standing Line! Up and down! You are a star!", emoji: '🏆', anim: 'shake' },
    ];
  }
  if (lower.includes('sleeping')) {
    return [
      { title: "Let's learn Sleeping Line!", speak: "Shh... it's Sleeping Line time! Sleeping line goes sleepy, sleepy... left to right!", emoji: '🛏️', anim: 'pop' },
      { title: 'Flat as a pillow!', speak: "Sleeping line lies flat... left to right... like a soft pillow!", emoji: '🛌', anim: 'float' },
      { title: 'Like a bridge!', speak: "See the bridge? It goes across from one side to the other! Left to right!", emoji: '🌉', anim: 'pulse' },
      { title: 'Like a rainbow!', speak: "A rainbow stretches across the sky! Left... to... right! Sleeping Line!", emoji: '🌈', anim: 'swing' },
      { title: 'Like the horizon!', speak: "The sun sets on the horizon... flat and straight! Left to right!", emoji: '🌅', anim: 'wiggle' },
      { title: 'Draw across!', speak: "Take your finger, start left, slide to the right! Sleeping Line!", emoji: '➡️', anim: 'jump' },
      { title: 'You got it!', speak: "You learned Sleeping Line! Left to right! You're amazing!", emoji: '⭐', anim: 'spin' },
    ];
  }
  if (lower.includes('slanting')) {
    return [
      { title: "Let's learn Slanting Line!", speak: "Wheee! Slanting Line time! Like a slide at the park!", emoji: '📐', anim: 'pop' },
      { title: 'Down the slide!', speak: "Whoosh down the slide! From the top... slanting down!", emoji: '🛝', anim: 'bounce' },
      { title: 'Like a kite string!', speak: "See the kite string going slanting up to the sky!", emoji: '🪁', anim: 'float' },
      { title: 'Like a roof!', speak: "Look at the house roof! It slants down on both sides!", emoji: '🏠', anim: 'pulse' },
      { title: 'Like an arrow!', speak: "An arrow shooting up at a slant! Zoom! Slanting Line!", emoji: '🏹', anim: 'jump' },
      { title: 'Slant and slide!', speak: "From the top, slide down slanting! Say it with me: Slanting Line!", emoji: '🧗', anim: 'bounce' },
      { title: 'Super slant!', speak: "You learned Slanting Line! Like a slide, like a roof! Brilliant!", emoji: '🎉', anim: 'shake' },
    ];
  }
  if (lower.includes('curved') || lower.includes('curve')) {
    return [
      { title: "Let's learn Curved Line!", speak: "Ooooh! Curved Line time! Round and round and round!", emoji: '🌈', anim: 'pop' },
      { title: 'Round like a ball!', speak: "A ball is round and smooth! That's a curved line going all around!", emoji: '⚽', anim: 'bounce' },
      { title: 'Like a big hug!', speak: "Open your arms wide... give yourself a hug! That round shape is a curve!", emoji: '🤗', anim: 'pulse' },
      { title: 'Like a smile!', speak: "Make a big happy smile! Curved up like a happy mouth!", emoji: '😊', anim: 'swing' },
      { title: 'Like a wave!', speak: "The ocean waves go up and down in curves! Whoosh!", emoji: '🌊', anim: 'float' },
      { title: 'Like a snake!', speak: "A snake slithers in curves! Ssss... curved line!", emoji: '🐍', anim: 'wiggle' },
      { title: 'Fantastic curves!', speak: "You learned Curved Line! Like a rainbow, a smile, a wave! Yay!", emoji: '🎊', anim: 'shake' },
    ];
  }
  if (lower.includes('zig') || lower.includes('zag')) {
    return [
      { title: "Let's learn Zig-Zag Line!", speak: "Ziggy zaggy zoo! Zig-Zag Line! Up and down, zip zap zoo!", emoji: '⚡', anim: 'pop' },
      { title: 'Crack goes lightning!', speak: "Lightning zig-zags across the sky! ZIG... ZAG!", emoji: '🌩️', anim: 'shake' },
      { title: 'Bounce like a ball!', speak: "The ball bounces up down up down! Zig-zag bounce!", emoji: '🏀', anim: 'bounce' },
      { title: 'Like mountains!', speak: "Mountains go up and down in a zig-zag! Peak after peak!", emoji: '⛰️', anim: 'jump' },
      { title: 'Like a saw!', speak: "A saw cuts zig-zag zig-zag! Back and forth!", emoji: '🪚', anim: 'wiggle' },
      { title: 'Sharp turns!', speak: "Zig right... zag left... zig right! Up and down we go!", emoji: '〽️', anim: 'swing' },
      { title: 'Zig-zag champ!', speak: "You learned Zig-Zag Line! Lightning, bounce, mountains! Incredible!", emoji: '🏆', anim: 'spin' },
    ];
  }

  // ═══════════════════════════════════════════════════════════════
  //  LKG ENGLISH CURRICULUM — Story-based tutorials for 2yr olds
  // ═══════════════════════════════════════════════════════════════

  // ─── NURSERY RHYMES ───
  if (lower.includes('twinkle') || lower.includes('twinkl') || lower.includes('star')) {
    return [
      { title: 'Twinkle Twinkle!', speak: "Twinkle twinkle little star! How I wonder what you are!", emoji: '⭐', anim: 'pop' },
      { title: 'Up in the sky!', speak: "Up above the world so high! Like a diamond in the sky!", emoji: '✨', anim: 'float' },
      { title: 'Twinkle twinkle!', speak: "Twinkle twinkle little star! Can you twinkle your fingers with me?", emoji: '🌟', anim: 'pulse' },
      { title: 'Diamond bright!', speak: "Like a diamond shining bright! All through the night!", emoji: '💎', anim: 'spin' },
      { title: 'Sing with me!', speak: "Twinkle twinkle little star! You sing so nicely! Let's clap!", emoji: '🎵', anim: 'wiggle' },
      { title: 'Dream of stars!', speak: "Sleep little one, dream of stars twinkling above! So beautiful!", emoji: '🌙', anim: 'float' },
      { title: 'Star champion!', speak: "You learned Twinkle Twinkle! Sing it for everyone! Yay!", emoji: '🎉', anim: 'shake' },
    ];
  }
  if (lower.includes('johnny') || lower.includes('yes papa')) {
    return [
      { title: 'Johnny Johnny!', speak: "Johnny Johnny! Yes Papa! Eating sugar? No Papa!", emoji: '👦', anim: 'pop' },
      { title: 'Telling lies?', speak: "Open your mouth! Ha ha ha! Johnny ate the sugar!", emoji: '👄', anim: 'wiggle' },
      { title: 'Shake your head!', speak: "No no no! Johnny shakes his head! No Papa, no sugar!", emoji: '🙅', anim: 'shake' },
      { title: 'Naughty Johnny!', speak: "You are naughty Johnny! But we love you anyway! Ha ha!", emoji: '😄', anim: 'bounce' },
      { title: 'Sing together!', speak: "Everybody now! Johnny Johnny! Yes Papa! Sing with me!", emoji: '🎤', anim: 'jump' },
      { title: 'Sugar is naughty!', speak: "Too much sugar is bad for teeth! Brush brush brush!", emoji: '🪥', anim: 'wiggle' },
      { title: 'Rhyme champ!', speak: "You learned Johnny Johnny! So fun! Give a big clap!", emoji: '👏', anim: 'shake' },
    ];
  }
  if (lower.includes('rain') && (lower.includes('go') || lower.includes('away'))) {
    return [
      { title: 'Rain Rain!', speak: "Rain rain go away! Come again another day!", emoji: '🌧️', anim: 'pop' },
      { title: 'Little baby wants to play!', speak: "Little baby wants to play! Rain please go away today!", emoji: '👶', anim: 'pulse' },
      { title: 'Sun come out!', speak: "Where is the sun? Come out sun! Little baby wants to play outside!", emoji: '☀️', anim: 'float' },
      { title: 'Splash in puddles!', speak: "Splash! Splash! Jumping in water puddles! Rain boots on!", emoji: '☂️', anim: 'bounce' },
      { title: 'Rainbow after rain!', speak: "After the rain comes a beautiful rainbow! All colors!", emoji: '🌈', anim: 'swing' },
      { title: 'Sing again!', speak: "Rain rain go away! Can you say it with me? Louder!", emoji: '🗣️', anim: 'jump' },
      { title: 'Sunny dance!', speak: "You learned Rain Rain Go Away! Now do a sunny dance!", emoji: '💃', anim: 'spin' },
    ];
  }
  if (lower.includes('baa') || lower.includes('black sheep')) {
    return [
      { title: 'Baa Baa Sheep!', speak: "Baa baa black sheep, have you any wool?", emoji: '🐑', anim: 'pop' },
      { title: 'Yes sir!', speak: "Yes sir, yes sir, three bags full!", emoji: '👍', anim: 'pulse' },
      { title: 'For the master!', speak: "One for the master! And one for the dame!", emoji: '👨‍👩‍👧', anim: 'float' },
      { title: 'For the little boy!', speak: "And one for the little boy who lives down the lane!", emoji: '👦', anim: 'bounce' },
      { title: 'Warm and cozy!', speak: "Wool is so warm and soft! Like a cozy sweater!", emoji: '🧶', anim: 'wiggle' },
      { title: 'Baa baa sing!', speak: "Can you sing Baa Baa with me? Baa baa black sheep!", emoji: '🎵', anim: 'jump' },
      { title: 'Sheep dance!', speak: "You learned Baa Baa Black Sheep! Let's hop like little sheep!", emoji: '🐏', anim: 'shake' },
    ];
  }
  if (lower.includes('humpty') || lower.includes('dumpty')) {
    return [
      { title: 'Humpty Dumpty!', speak: "Humpty Dumpty sat on a wall! Humpty Dumpty had a great fall!", emoji: '🥚', anim: 'pop' },
      { title: 'Sitting on the wall!', speak: "Look at Humpty sitting so high on the wall! So brave!", emoji: '🧱', anim: 'float' },
      { title: 'Oh no! A fall!', speak: "Whoops! Humpty fell down! All the king's horses and all the king's men!", emoji: '😮', anim: 'shake' },
      { title: 'Can they fix him?', speak: "Can they put Humpty together again? No! He's broken!", emoji: '😢', anim: 'pulse' },
      { title: 'Be careful!', speak: "We must be careful on walls! Hold someone's hand!", emoji: '🤝', anim: 'wiggle' },
      { title: 'Sing the rhyme!', speak: "Humpty Dumpty sat on a wall! Say it with me!", emoji: '📖', anim: 'jump' },
      { title: 'Happy Humpty!', speak: "You learned Humpty Dumpty! Let's give Humpty a happy hug!", emoji: '🤗', anim: 'spin' },
    ];
  }
  if (lower.includes('jack') && lower.includes('jill')) {
    return [
      { title: 'Jack and Jill!', speak: "Jack and Jill went up the hill! To fetch a pail of water!", emoji: '⛰️', anim: 'pop' },
      { title: 'Up the hill!', speak: "Up up up the hill they go! Climbing carrying the pail!", emoji: '🧗', anim: 'jump' },
      { title: 'Jack falls down!', speak: "Jack falls down! Oh no! And breaks his crown!", emoji: '🤕', anim: 'shake' },
      { title: 'Jill comes tumbling!', speak: "And Jill comes tumbling after! All the way down!", emoji: '🔄', anim: 'bounce' },
      { title: 'Get back up!', speak: "It's okay! Get back up! Try again! You can do it!", emoji: '💪', anim: 'pulse' },
      { title: 'Up the hill again!', speak: "Jack and Jill go up again! Never give up!", emoji: '⛰️', anim: 'float' },
      { title: 'Never give up!', speak: "You learned Jack and Jill! If you fall, get back up! Yay!", emoji: '🏆', anim: 'spin' },
    ];
  }

  // ─── STORY TIME ───
  if (lower.includes('lion') && lower.includes('mouse')) {
    return [
      { title: 'Lion and Mouse!', speak: "The Lion and the Mouse! A big lion and a tiny mouse!", emoji: '🦁', anim: 'pop' },
      { title: 'Roaring lion!', speak: "The lion roars! ROAR! But the tiny mouse is not scared!", emoji: '🐭', anim: 'shake' },
      { title: 'Mouse helps lion!', speak: "The mouse chews the net! Chip chip chip! Lion is free!", emoji: '🦴', anim: 'wiggle' },
      { title: 'Big and small!', speak: "Even tiny friends can help! The mouse saved the lion!", emoji: '💝', anim: 'pulse' },
      { title: 'Be kind!', speak: "Always be kind to everyone! Big or small! Kindness matters!", emoji: '🤗', anim: 'float' },
      { title: 'Can you say Lion?', speak: "Say Lion! Lllion! Say Mouse! Mmmouse! You can do it!", emoji: '🗣️', anim: 'jump' },
      { title: 'Kindness star!', speak: "You learned Lion and Mouse! Be kind like the mouse! Give a hug!", emoji: '⭐', anim: 'spin' },
    ];
  }
  if (lower.includes('thirsty') || (lower.includes('crow') && !lower.includes('snow'))) {
    return [
      { title: 'Thirsty Crow!', speak: "The Thirsty Crow! A crow is very very thirsty!", emoji: '🐦', anim: 'pop' },
      { title: 'Where is water?', speak: "The crow looks for water! But the pot has only a little!", emoji: '🏺', anim: 'pulse' },
      { title: 'Clever crow!', speak: "The crow drops pebbles! One by one! Plop plop plop!", emoji: '🪨', anim: 'bounce' },
      { title: 'Water rises!', speak: "The water comes up! Up up up! Now the crow can drink!", emoji: '💧', anim: 'float' },
      { title: 'So clever!', speak: "The clever crow solved the problem! Think think think!", emoji: '🧠', anim: 'pulse' },
      { title: 'Never give up!', speak: "The crow did not give up! Try try try again!", emoji: '💪', anim: 'jump' },
      { title: 'Smart crow champ!', speak: "You learned Thirsty Crow! Be clever, never give up! Clap!", emoji: '🎉', anim: 'shake' },
    ];
  }
  if ((lower.includes('hare') && lower.includes('tortoise')) || lower.includes('slow') || (lower.includes('tortoise') && lower.includes('hare'))) {
    return [
      { title: 'Hare and Tortoise!', speak: "The Hare and the Tortoise! Fast rabbit... slow turtle... who wins?", emoji: '🐰', anim: 'pop' },
      { title: 'Hare is too fast!', speak: "The hare zooms fast! Too fast! He stops to take a nap!", emoji: '💨', anim: 'jump' },
      { title: 'Tortoise keeps going!', speak: "Slow and steady! The tortoise keeps walking! Step by step!", emoji: '🐢', anim: 'pulse' },
      { title: 'Hare wakes up!', speak: "The hare wakes up! Oh no! The tortoise is almost at the finish!", emoji: '😲', anim: 'shake' },
      { title: 'Tortoise wins!', speak: "Slow and steady wins the race! The tortoise did it!", emoji: '🏆', anim: 'spin' },
      { title: 'Don\'t give up!', speak: "Keep going! Even if you are slow, don't stop! You can win!", emoji: '💪', anim: 'bounce' },
      { title: 'Steady winner!', speak: "You learned Hare and Tortoise! Slow and steady wins! Yay!", emoji: '🎊', anim: 'shake' },
    ];
  }
  if (lower.includes('ugly') || lower.includes('duckling') || lower.includes('swan')) {
    return [
      { title: 'Ugly Duckling!', speak: "The Ugly Duckling! A baby duck looks different from others!", emoji: '🐤', anim: 'pop' },
      { title: 'They tease him!', speak: "The other ducks say: You are ugly! Go away!", emoji: '😢', anim: 'pulse' },
      { title: 'He is sad!', speak: "The little duckling is so sad and lonely! He hides away!", emoji: '😔', anim: 'float' },
      { title: 'He grows up!', speak: "Days pass, the duckling grows... and grows... and changes!", emoji: '🦢', anim: 'float' },
      { title: 'A beautiful swan!', speak: "He is not a duck! He is a beautiful white swan! So pretty!", emoji: '🕊️', anim: 'spin' },
      { title: 'You are special!', speak: "Everyone is special! Don't let anyone make you sad! You are beautiful!", emoji: '💖', anim: 'pulse' },
      { title: 'Beautiful you!', speak: "You learned Ugly Duckling! You are special and beautiful! Hug!", emoji: '🤗', anim: 'shake' },
    ];
  }
  if (lower.includes('gingerbread') || lower.includes('ginger')) {
    return [
      { title: 'Gingerbread Man!', speak: "Run run run! The Gingerbread Man! He runs away!", emoji: '🫚', anim: 'pop' },
      { title: 'Baked by grandma!', speak: "Grandma bakes a gingerbread man! But he jumps up and runs!", emoji: '👩‍🍳', anim: 'pulse' },
      { title: 'Run run run!', speak: "Run run as fast as you can! You can't catch me, I'm the Gingerbread Man!", emoji: '🏃', anim: 'jump' },
      { title: 'Animals chase him!', speak: "The cow chases! The horse chases! But Gingerbread Man is too fast!", emoji: '🐄', anim: 'bounce' },
      { title: 'Fox helps?', speak: "A sly fox says: I can help you cross the river! Hop on my nose!", emoji: '🦊', anim: 'wiggle' },
      { title: 'Snap!', speak: "The fox snaps! Yum yum! The gingerbread man is gone!", emoji: '😋', anim: 'shake' },
      { title: 'Run and play!', speak: "You learned Gingerbread Man! Run run run! Time for a run race!", emoji: '🎯', anim: 'spin' },
    ];
  }
  if (lower.includes('red') && lower.includes('riding') || lower.includes('wolf') && lower.includes('hood')) {
    return [
      { title: 'Red Riding Hood!', speak: "Little Red Riding Hood! Grandmother's basket is full of goodies!", emoji: '🧺', anim: 'pop' },
      { title: 'Walking through woods!', speak: "Through the woods she walks! Picking flowers along the way!", emoji: '🌺', anim: 'float' },
      { title: 'Big bad wolf!', speak: "The wolf asks: Where are you going, little girl? To Grandma's house!", emoji: '🐺', anim: 'shake' },
      { title: 'Wolf tricks her!', speak: "The wolf runs to Grandma's! He swallows Grandma! Oh no!", emoji: '😱', anim: 'bounce' },
      { title: 'Big eyes and teeth!', speak: "Grandma, what big eyes you have! And big teeth! All the better to eat you!", emoji: '👀', anim: 'pulse' },
      { title: 'Woodcutter saves!', speak: "The woodcutter hears! He saves Grandma and Red! The wolf runs away!", emoji: '🪓', anim: 'jump' },
      { title: 'Safe and sound!', speak: "You learned Red Riding Hood! Don't talk to strangers! Stay safe!", emoji: '🛡️', anim: 'spin' },
    ];
  }

  // ─── PHONICS — at/am/an ───
  if (lower.includes('at') && (lower.includes('am') || lower.includes('an')) && (lower.includes('phonics') || lower.includes('family') || lower.includes('word'))) {
    return [
      { title: "🏠 Welcome to the 'at' Family!", speak: "Welcome little reader! Today we meet a word family where every word ends with 'at'. Let's spell them together!", emoji: '🏠', anim: 'pop', word: 'at', family: 'at' },
      { title: "🐱 c-a-t spells Cat!", speak: "c-a-t... cat! A soft furry cat that says meow! Can you spell cat with me? c-a-t!", emoji: '🐱', anim: 'bounce', word: 'cat', family: 'at' },
      { title: "🦇 b-a-t spells Bat!", speak: "b-a-t... bat! A bat that flies in the night sky! Flap your arms like a bat! b-a-t!", emoji: '🦇', anim: 'float', word: 'bat', family: 'at' },
      { title: "🎩 h-a-t spells Hat!", speak: "h-a-t... hat! A fancy hat for your head! Tap tap, put it on! h-a-t!", emoji: '🎩', anim: 'pop', word: 'hat', family: 'at' },
      { title: "👨 m-a-n spells Man!", speak: "m-a-n... man! A friendly man waves hello! Wave back and say m-a-n!", emoji: '👨', anim: 'pulse', word: 'man', family: 'an' },
      { title: "🌀 f-a-n spells Fan!", speak: "f-a-n... fan! A spinning fan that goes round and round! Spin your finger! f-a-n!", emoji: '🌀', anim: 'spin', word: 'fan', family: 'an' },
      { title: "⭐ You read 'at' words!", speak: "You read cat, bat, hat — all with 'at'! And man, fan — with 'an'! Give yourself a big clap!", emoji: '⭐', anim: 'shake' },
    ];
  }
  // ─── PHONICS — it/in/ig ───
  if (lower.includes('it') && (lower.includes('in') || lower.includes('ig')) && (lower.includes('phonics') || lower.includes('family') || lower.includes('word'))) {
    return [
      { title: "🏠 Welcome to the 'it' Family!", speak: "Here is a tiny word family — 'it'! With just two letters we can make many words. Let's explore!", emoji: '🏠', anim: 'pop', word: 'it', family: 'it' },
      { title: "🕳️ p-i-t spells Pit!", speak: "p-i-t... pit! A deep hole in the ground! Be careful, step around! p-i-t!", emoji: '🕳️', anim: 'bounce', word: 'pit', family: 'it' },
      { title: "🪑 s-i-t spells Sit!", speak: "s-i-t... sit! Time to sit down nicely! Plop on your bottom and say s-i-t!", emoji: '🪑', anim: 'pulse', word: 'sit', family: 'it' },
      { title: "🐷 p-i-g spells Pig!", speak: "p-i-g... pig! A happy pink pig that says oink oink! Snort like a pig! p-i-g!", emoji: '🐷', anim: 'bounce', word: 'pig', family: 'ig' },
      { title: "📌 p-i-n spells Pin!", speak: "p-i-n... pin! A tiny pin that sticks on your shirt! Tap tap! p-i-n!", emoji: '📌', anim: 'pulse', word: 'pin', family: 'in' },
      { title: "🏆 You read 'it' words!", speak: "Pit, sit with 'it'! Pig with 'ig'! Pin with 'in'! You read every word! Clever you!", emoji: '🏆', anim: 'spin' },
    ];
  }
  // ─── PHONICS — op/ot/og ───
  if (lower.includes('op') && (lower.includes('ot') || lower.includes('og')) && (lower.includes('phonics') || lower.includes('family') || lower.includes('word'))) {
    return [
      { title: "🏠 Welcome to the 'op' Family!", speak: "Now we meet three families — 'op', 'ot' and 'og'! Each one makes fun words. Let's begin!", emoji: '🏠', anim: 'pop', word: 'op', family: 'op' },
      { title: "🧹 m-o-p spells Mop!", speak: "m-o-p... mop! Swish swash, clean the floor! Grab your mop and say m-o-p!", emoji: '🧹', anim: 'wiggle', word: 'mop', family: 'op' },
      { title: "🍲 p-o-t spells Pot!", speak: "p-o-t... pot! Hot yummy soup cooking in a pot! Slurp slurp! p-o-t!", emoji: '🍲', anim: 'bounce', word: 'pot', family: 'ot' },
      { title: "🐶 d-o-g spells Dog!", speak: "d-o-g... dog! A happy dog wags its tail! Woof woof! Can you wag like a dog? d-o-g!", emoji: '🐶', anim: 'jump', word: 'dog', family: 'og' },
      { title: "🪵 l-o-g spells Log!", speak: "l-o-g... log! A big log to sit on in the forest! Rest your legs and say l-o-g!", emoji: '🪵', anim: 'pulse', word: 'log', family: 'og' },
      { title: "✨ You read 'op' words!", speak: "Mop with 'op', pot with 'ot', dog and log with 'og'! Three families, you read them all! Fantastic!", emoji: '✨', anim: 'shake' },
    ];
  }

  // ─── CVC WORDS ───
  if (lower.includes('cvc') || (lower.includes('cat') && lower.includes('bat') && lower.includes('hat'))) {
    return [
      { title: "📖 What are CVC Words?", speak: "CVC words have just three letters — a consonant, a vowel, and a consonant. Let's blend sounds and read them!", emoji: '📖', anim: 'pop', word: 'cat' },
      { title: "🐱 c-a-t says Cat!", speak: "c-a-t... cat! A soft furry cat purring on your lap! Pet the cat and say c-a-t!", emoji: '🐱', anim: 'pulse', word: 'cat' },
      { title: "🦇 b-a-t says Bat!", speak: "b-a-t... bat! A bat soaring through the night! Flap your wings and say b-a-t!", emoji: '🦇', anim: 'float', word: 'bat' },
      { title: "🎩 h-a-t says Hat!", speak: "h-a-t... hat! A colourful hat sitting on your head! Touch your head and say h-a-t!", emoji: '🎩', anim: 'bounce', word: 'hat' },
      { title: "🧶 m-a-t says Mat!", speak: "m-a-t... mat! A soft mat to sit and play on! Cross your legs and say m-a-t!", emoji: '🧶', anim: 'pulse', word: 'mat' },
      { title: "🐀 r-a-t says Rat!", speak: "r-a-t... rat! A tiny rat scurrying across the floor! Run your fingers and say r-a-t!", emoji: '🐀', anim: 'jump', word: 'rat' },
      { title: "🌟 You read CVC words!", speak: "Cat, bat, hat, mat, rat — five CVC words all by yourself! You are a blending superstar! Clap clap clap!", emoji: '🌟', anim: 'shake' },
    ];
  }
  // ─── WORD FAMILY — og ───
  if (lower.includes('dog') && lower.includes('log') && lower.includes('fog')) {
    return [
      { title: "🏠 Discover the 'og' Family!", speak: "Can you hear it? Dog, log, fog — they all share the 'og' sound at the end! Let's read them one by one!", emoji: '🏠', anim: 'pop', word: 'dog', family: 'og' },
      { title: "🐶 d-o-g says Dog!", speak: "d-o-g... dog! A fluffy dog that wags its tail and says woof! Wag your body and say d-o-g!", emoji: '🐶', anim: 'bounce', word: 'dog', family: 'og' },
      { title: "🪵 l-o-g says Log!", speak: "l-o-g... log! A big wooden log resting on the ground! Sit carefully and say l-o-g!", emoji: '🪵', anim: 'pulse', word: 'log', family: 'og' },
      { title: "🌫️ f-o-g says Fog!", speak: "f-o-g... fog! Misty clouds all around, can't see far! Cover your eyes and say f-o-g!", emoji: '🌫️', anim: 'float', word: 'fog', family: 'og' },
      { title: "🐷 h-o-g says Hog!", speak: "h-o-g... hog! A big round pig that goes oink oink! Puff your cheeks and say h-o-g!", emoji: '🐷', anim: 'wiggle', word: 'hog', family: 'og' },
      { title: "🏃 j-o-g says Jog!", speak: "j-o-g... jog! Time to jog on the spot! Run run and say j-o-g!", emoji: '🏃', anim: 'jump', word: 'jog', family: 'og' },
      { title: "🦸 You read 'og' words!", speak: "Dog, log, fog, hog, jog — five words all with 'og'! You spotted the pattern! Reading superhero!", emoji: '🦸', anim: 'shake' },
    ];
  }
  // ─── WORD FAMILY — un/ut/ub ───
  if (lower.includes('un') && (lower.includes('ut') || lower.includes('ub'))) {
    return [
      { title: "🏠 Discover the 'un' Family!", speak: "Welcome to the 'un' word family! Sun, fun, run — they all end with 'un'! Let's read them together!", emoji: '🏠', anim: 'pop', word: 'sun', family: 'un' },
      { title: "☀️ s-u-n says Sun!", speak: "s-u-n... sun! The sun shines warm and bright! Stretch your arms up and say s-u-n!", emoji: '☀️', anim: 'float', word: 'sun', family: 'un' },
      { title: "🎮 f-u-n says Fun!", speak: "f-u-n... fun! Learning to read is fun! Smile and say f-u-n!", emoji: '🎮', anim: 'bounce', word: 'fun', family: 'un' },
      { title: "🏃 r-u-n says Run!", speak: "r-u-n... run! Let's run fast like the wind! Move your legs and say r-u-n!", emoji: '🏃', anim: 'jump', word: 'run', family: 'un' },
      { title: "🥯 b-u-n says Bun!", speak: "b-u-n... bun! A soft warm bun to eat! Nom nom! Say b-u-n!", emoji: '🥯', anim: 'pulse', word: 'bun', family: 'un' },
      { title: "🎉 You read 'un' words!", speak: "Sun, fun, run, bun — all have 'un'! You found the pattern! Dance and celebrate!", emoji: '🎉', anim: 'spin' },
    ];
  }
  // ─── WORD FAMILY — un (sun/run/fun pattern) ───
  if (lower.includes('sun') && lower.includes('run') && lower.includes('fun')) {
    return [
      { title: "🏠 Discover the 'un' Family!", speak: "Listen closely — sun, run, fun, bun! They all end with 'un'! Let's sound them out together!", emoji: '🏠', anim: 'pop', word: 'sun', family: 'un' },
      { title: "☀️ s-u-n says Sun!", speak: "s-u-n... sun! The bright warm sun shining in the sky! Stretch your arms up and say s-u-n!", emoji: '☀️', anim: 'float', word: 'sun', family: 'un' },
      { title: "🏃 r-u-n says Run!", speak: "r-u-n... run! Let's run as fast as we can! Zoom zoom! Move your legs and say r-u-n!", emoji: '🏃', anim: 'jump', word: 'run', family: 'un' },
      { title: "🎮 f-u-n says Fun!", speak: "f-u-n... fun! Learning to read is so much fun! Smile wide and say f-u-n!", emoji: '🎮', anim: 'bounce', word: 'fun', family: 'un' },
      { title: "🥯 b-u-n says Bun!", speak: "b-u-n... bun! A warm soft bun fresh from the oven! Pretend to eat and say b-u-n!", emoji: '🥯', anim: 'pulse', word: 'bun', family: 'un' },
      { title: "🎉 You read 'un' words!", speak: "Sun, run, fun, bun — all have 'un'! You cracked the code! Now dance and celebrate!", emoji: '🎉', anim: 'spin' },
    ];
  }

  // ─── SIMPLE WORDS ───
  if (lower.includes('simple') || (lower.includes('cat') && lower.includes('dog') && lower.includes('moon'))) {
    return [
      { title: "📖 Let's Read Simple Words!", speak: "You have learned so many sounds! Now let's put them together and read simple words all by yourself!", emoji: '📖', anim: 'pop' },
      { title: "🐱 Cat! c-a-t", speak: "c-a-t... cat! A sweet cat curling up for a nap! Can you read this word? c-a-t, cat!", emoji: '🐱', anim: 'bounce', word: 'cat' },
      { title: "🐶 Dog! d-o-g", speak: "d-o-g... dog! A playful dog wagging its tail! Can you read this word? d-o-g, dog!", emoji: '🐶', anim: 'jump', word: 'dog' },
      { title: "☀️ Sun! s-u-n", speak: "s-u-n... sun! The glowing sun brightening the day! Can you read this word? s-u-n, sun!", emoji: '☀️', anim: 'float', word: 'sun' },
      { title: "🌙 Moon! m-o-o-n", speak: "m-o-o-n... moon! The gentle moon watching at night! Can you read this word? m-o-o-n, moon!", emoji: '🌙', anim: 'pulse', word: 'moon' },
      { title: "📚 You read!", speak: "You read cat, dog, sun, moon — all by yourself! Every single word! I am so proud of you!", emoji: '📚', anim: 'spin' },
      { title: "⭐ Reading Star!", speak: "Today you became a reading star! Keep reading every day and you will shine brighter and brighter!", emoji: '⭐', anim: 'shake' },
    ];
  }

  // ─── SMALL LETTERS ───
  if (lower.includes('small') && (lower.includes('a-m') || lower.includes('a to m'))) {
    return [
      { title: 'Small letters a-m!', speak: "Let's learn small letters from a to m! Ready?", emoji: '🔤', anim: 'pop' },
      { title: 'a b c d!', speak: "a is for apple! b is for ball! c is for cat! d is for dog!", emoji: '📚', anim: 'pulse' },
      { title: 'e f g h!', speak: "e is for elephant! f is for fish! g is for grapes! h is for hat!", emoji: '🐘', anim: 'bounce' },
      { title: 'i j k l m!', speak: "i is for igloo! j is for jug! k is for kite! l is for lion! m is for monkey!", emoji: '🐵', anim: 'wiggle' },
      { title: 'Trace with finger!', speak: "Trace a with your finger! Round and down! Now b! Down and around!", emoji: '✍️', anim: 'jump' },
      { title: 'Sing the alphabet!', speak: "A B C D E F G... H I J K L M! Sing with me!", emoji: '🎵', anim: 'swing' },
      { title: 'Letter star!', speak: "You learned a to m! Small letters! So clever! Give a clap!", emoji: '⭐', anim: 'shake' },
    ];
  }
  if (lower.includes('small') && (lower.includes('n-z') || lower.includes('n to z'))) {
    return [
      { title: 'Small letters n-z!', speak: "Let's learn small letters from n to z! You can do it!", emoji: '🔤', anim: 'pop' },
      { title: 'n o p q!', speak: "n is for nest! o is for orange! p is for parrot! q is for queen!", emoji: '👑', anim: 'pulse' },
      { title: 'r s t u!', speak: "r is for rabbit! s is for sun! t is for tiger! u is for umbrella!", emoji: '🐯', anim: 'bounce' },
      { title: 'v w x y z!', speak: "v is for van! w is for watch! x is for xylophone! y is for yak! z is for zebra!", emoji: '🦓', anim: 'wiggle' },
      { title: 'Trace them all!', speak: "Trace n with your finger! Up down up! Now z! Zig zag zig!", emoji: '✍️', anim: 'jump' },
      { title: 'Full alphabet!', speak: "Now you know a to z! All the letters! Sing the ABC song!", emoji: '🎵', anim: 'swing' },
      { title: 'Alphabet champ!', speak: "You learned all small letters! a to z! Alphabet champion!", emoji: '🏆', anim: 'spin' },
    ];
  }

  // ─── SINGLE ALPHABET LETTERS ───
  // Single alphabet letters (A-Z or "Letter A")
  const letterMatch = t.match(/[A-Za-z]/);
  if (lower.includes('letter') || (letterMatch && t.length <= 2)) {
    const letter = letterMatch ? letterMatch[0].toUpperCase() : t;
    const words: Record<string, string> = {
      A: 'Apple', B: 'Ball', C: 'Cat', D: 'Dog', E: 'Elephant', F: 'Fish',
      G: 'Grapes', H: 'Hat', I: 'Ice cream', J: 'Jug', K: 'Kite', L: 'Lion',
      M: 'Monkey', N: 'Nest', O: 'Orange', P: 'Parrot', Q: 'Queen', R: 'Rabbit',
      S: 'Sun', T: 'Tiger', U: 'Umbrella', V: 'Van', W: 'Watch', X: 'Xylophone',
      Y: 'Yak', Z: 'Zebra'
    };
    const word = words[letter] || letter;
    const wordEmoji = getWordEmoji(word);
    return [
      { title: `Letter ${letter}!`, speak: `Let's learn letter ${letter}!`, emoji: '🔤', anim: 'pop' },
      { title: `This is ${letter}.`, speak: `This is letter ${letter}.`, emoji: letter, anim: 'pulse' },
      { title: `${letter} for ${word}`, speak: `${letter} is for ${word}. ${word}!`, emoji: wordEmoji, anim: 'bounce' },
      { title: 'Say it!', speak: `Can you say ${letter}?`, emoji: '🗣️', anim: 'wiggle' },
      { title: 'Great job!', speak: `You learned letter ${letter}!`, emoji: '⭐', anim: 'spin' },
    ];
  }

  // Numbers
  const numMatch = t.match(/\d/);
  if (lower.includes('number') || numMatch) {
    const num = numMatch ? numMatch[0] : '1';
    const countEmojis = ['🍎','🍌','🍇','🍊','⭐','🐶','🐱','🦋','🌸','🚗'];
    const e = countEmojis[parseInt(num) - 1] || '⭐';
    return [
      { title: `Number ${num}!`, speak: `Let's learn number ${num}!`, emoji: '🔢', anim: 'pop' },
      { title: `This is ${num}.`, speak: `This is number ${num}.`, emoji: num, anim: 'pulse' },
      { title: `Count ${num}!`, speak: `Count with me. ${Array(parseInt(num)).fill(e).join(' ')}. ${num}!`, emoji: e, anim: 'bounce' },
      { title: 'Say it!', speak: `Can you say ${num}?`, emoji: '🗣️', anim: 'wiggle' },
      { title: 'Great job!', speak: `You learned number ${num}!`, emoji: '⭐', anim: 'spin' },
    ];
  }

  // ─── MY NAME WRITING ───
  if (lower.includes('name') || lower.includes('name writing') || lower.includes('my name')) {
    const name = studentName || 'Little Star';
    const letters = name.split('');
    const steps: TutorialStep[] = [
      { title: `✏️ Let's Write Your Name!`, speak: `Do you know what the most special word in the world is? It's your name! ${name}! Let's learn to write it together!`, emoji: '👤', anim: 'pop' },
      { title: `🎶 ${name} Song!`, speak: `Let's sing! ${name}, ${name}, that's your name! ${name}, ${name}, what a beautiful name! Can you clap along?`, emoji: '🎵', anim: 'swing' },
      { title: `👆 Trace your name!`, speak: `Use your finger and trace ${name} on the screen! Each letter is special, just like you! Start from the first letter!`, emoji: '👆', anim: 'bounce' },
    ];

    // Add each letter as a step
    for (let i = 0; i < Math.min(letters.length, 8); i++) {
      const letter = letters[i].toUpperCase();
      steps.push({
        title: `✍️ Letter ${letter}!`,
        speak: `Now let's write the letter ${letter}! ${letter} is the ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} letter in ${name}! Trace it carefully, you can do it!`,
        emoji: letter,
        anim: i % 2 === 0 ? 'pulse' : 'bounce',
        word: letter,
      });
    }

    steps.push({
      title: `⭐ You Wrote ${name}!`,
      speak: `You wrote ${name}! Every single letter! That is your special name and you can write it all by yourself! Give a big hug and say: That's my name!`,
      emoji: '🏆',
      anim: 'shake',
    });

    return steps;
  }

  // Colors
  const colorEmojis: Record<string, string> = {
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡',
    orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪'
  };
  const colorKey = Object.keys(colorEmojis).find(c => lower.includes(c));
  if (colorKey) {
    return [
      { title: `${capitalize(colorKey)}!`, speak: `Let's learn the color ${colorKey}!`, emoji: '🎨', anim: 'pop' },
      { title: `This is ${colorKey}.`, speak: `This is ${colorKey}.`, emoji: colorEmojis[colorKey], anim: 'pulse' },
      { title: 'Look around!', speak: `Can you find something ${colorKey} near you?`, emoji: '👀', anim: 'wiggle' },
      { title: 'Say it!', speak: `Say ${colorKey}!`, emoji: '🗣️', anim: 'jump' },
      { title: 'Great job!', speak: `You learned the color ${colorKey}!`, emoji: '⭐', anim: 'spin' },
    ];
  }

  // Shapes
  if (lower.includes('circle')) {
    return [
      { title: 'Circle!', speak: 'Circle is round round round!', emoji: '⭕', anim: 'pop' },
      { title: 'Like a ball!', speak: 'Like a ball, like a wheel, circle!', emoji: '🏀', anim: 'bounce' },
      { title: 'Say Circle!', speak: 'Can you say Circle?', emoji: '⭕', anim: 'pulse' },
      { title: 'Great job!', speak: 'You learned Circle!', emoji: '⭐', anim: 'spin' },
    ];
  }
  if (lower.includes('square')) {
    return [
      { title: 'Square!', speak: 'Square has four same sides!', emoji: '⬜', anim: 'pop' },
      { title: 'Like a box!', speak: 'Like a box, like a window, square!', emoji: '📦', anim: 'pulse' },
      { title: 'Say Square!', speak: 'Can you say Square?', emoji: '⬜', anim: 'wiggle' },
      { title: 'Great job!', speak: 'You learned Square!', emoji: '⭐', anim: 'spin' },
    ];
  }
  if (lower.includes('triangle')) {
    return [
      { title: 'Triangle!', speak: 'Triangle has three sides!', emoji: '🔺', anim: 'pop' },
      { title: 'Like a samosa!', speak: 'Like a samosa, like a mountain, triangle!', emoji: '🏔️', anim: 'pulse' },
      { title: 'Say Triangle!', speak: 'Can you say Triangle?', emoji: '🔺', anim: 'wiggle' },
      { title: 'Great job!', speak: 'You learned Triangle!', emoji: '⭐', anim: 'spin' },
    ];
  }

  // Animals
  const animals: Record<string, string> = { cat: '🐱', dog: '🐶', lion: '🦁', elephant: '🐘', bird: '🐦', fish: '🐟', cow: '🐮', monkey: '🐵' };
  const animalKey = Object.keys(animals).find(a => lower.includes(a));
  if (animalKey) {
    return [
      { title: capitalize(animalKey), speak: `This is a ${animalKey}.`, emoji: animals[animalKey], anim: 'pop' },
      { title: 'Look!', speak: `${capitalize(animalKey)} says ${animalSound(animalKey)}.`, emoji: animals[animalKey], anim: 'bounce' },
      { title: 'Say it!', speak: `Can you say ${animalKey}?`, emoji: '🗣️', anim: 'wiggle' },
      { title: 'Great job!', speak: `You learned ${capitalize(animalKey)}!`, emoji: '⭐', anim: 'spin' },
    ];
  }

  // Fruits
  const fruits: Record<string, string> = { apple: '🍎', banana: '🍌', mango: '🥭', grapes: '🍇', orange: '🍊', watermelon: '🍉' };
  const fruitKey = Object.keys(fruits).find(f => lower.includes(f));
  if (fruitKey) {
    return [
      { title: capitalize(fruitKey), speak: `This is a ${fruitKey}.`, emoji: fruits[fruitKey], anim: 'pop' },
      { title: 'Yummy!', speak: `${capitalize(fruitKey)} is tasty and healthy!`, emoji: fruits[fruitKey], anim: 'bounce' },
      { title: 'Say it!', speak: `Can you say ${fruitKey}?`, emoji: '🗣️', anim: 'wiggle' },
      { title: 'Great job!', speak: `You learned ${capitalize(fruitKey)}!`, emoji: '⭐', anim: 'spin' },
    ];
  }

  // Default fallback tutorial
  return [
    { title: `Let's learn ${t}!`, speak: `Let's learn about ${t}!`, emoji: '📚', anim: 'pop' },
    { title: 'Look!', speak: `This is ${t}.`, emoji: '🌟', anim: 'pulse' },
    { title: 'Say it!', speak: `Can you say ${t}?`, emoji: '🗣️', anim: 'wiggle' },
    { title: 'Great job!', speak: `You learned ${t}!`, emoji: '⭐', anim: 'spin' },
  ];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function animalSound(a: string) {
  const map: Record<string, string> = {
    cat: 'meow', dog: 'woof', lion: 'roar', elephant: 'trumpet',
    bird: 'tweet', fish: 'blub', cow: 'moo', monkey: 'oo oo ah ah'
  };
  return map[a] || a;
}

function getWordEmoji(word: string) {
  const map: Record<string, string> = {
    Apple: '🍎', Ball: '⚽', Cat: '🐱', Dog: '🐶', Elephant: '🐘', Fish: '🐟',
    Grapes: '🍇', Hat: '🎩', 'Ice cream': '🍦', Jug: '🍶', Kite: '🪁', Lion: '🦁',
    Monkey: '🐵', Nest: '🪹', Orange: '🍊', Parrot: '🦜', Queen: '👸', Rabbit: '🐰',
    Sun: '☀️', Tiger: '🐯', Umbrella: '☂️', Van: '🚐', Watch: '⌚', Xylophone: '🎹',
    Yak: '🦬', Zebra: '🦓'
  };
  return map[word] || '⭐';
}

const COLOR_SET = [
  'from-red-400 to-rose-500', 'from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500',
  'from-orange-400 to-amber-500', 'from-purple-400 to-violet-500', 'from-pink-400 to-fuchsia-500',
];

function shuffleQuiz<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QuizQuestion = {
  question: string;
  correctWord: string;
  correctEmoji: string;
  options: { word: string; emoji: string }[];
};

/* ─── STROKE LABELS ─── */
const STROKE_LABELS: Record<string, string> = {
  standing: 'Standing Line', sleeping: 'Sleeping Line',
  'left-slanting': 'Left Slanting Line', 'right-slanting': 'Right Slanting Line',
  'left-curve': 'Left Curve', 'right-curve': 'Right Curve',
  'up-curve': 'Up Curve', 'down-curve': 'Down Curve',
};

const QUIZ_STROKES = ['standing', 'sleeping', 'left-slanting', 'right-slanting', 'left-curve', 'right-curve', 'up-curve', 'down-curve'];
const PRACTICE_COUNT = 1;
const EXAM_COUNT = 5;

function generateQuiz(steps: TutorialStep[]): QuizQuestion[] {
  const wordSteps = steps.filter((s): s is TutorialStep & { word: string; emoji: string } => !!s.word && !!s.emoji);
  if (wordSteps.length < 2) return [];

  const families = new Map<string, { word: string; emoji: string }[]>();
  for (const s of wordSteps) {
    const f = s.family || s.word;
    if (!families.has(f)) families.set(f, []);
    families.get(f)!.push({ word: s.word, emoji: s.emoji });
  }

  const questions: QuizQuestion[] = [];

  // Pick 3-4 words from the biggest family
  let maxFam = '';
  let maxWords: { word: string; emoji: string }[] = [];
  for (const [f, words] of families) {
    if (words.length > maxWords.length) { maxFam = f; maxWords = words; }
  }

  if (maxWords.length >= 2) {
    const selected = shuffleQuiz(maxWords).slice(0, Math.min(4, maxWords.length));
    // Collect words from OTHER families for distractors
    const otherFamilyWords: { word: string; emoji: string }[] = [];
    for (const [f, words] of families) {
      if (f !== maxFam) otherFamilyWords.push(...words);
    }

    const singleFamily = otherFamilyWords.length === 0;

    for (const correct of selected) {
      let wrong: { word: string; emoji: string }[];
      if (singleFamily) {
        // Only one family — pick different words from same family as distractors
        wrong = shuffleQuiz(maxWords.filter(w => w.word !== correct.word)).slice(0, 2);
      } else {
        wrong = shuffleQuiz(otherFamilyWords).slice(0, 2);
      }
      const options = shuffleQuiz([
        { word: correct.word, emoji: correct.emoji },
        ...wrong,
      ]);
      questions.push({
        question: singleFamily
          ? `Where is ${correct.word}?`
          : maxFam.length <= 3
            ? `Find the word with '${maxFam}'!`
            : `Find the word '${correct.word}'!`,
        correctWord: correct.word,
        correctEmoji: correct.emoji,
        options,
      });
    }
  }

  // Add a mix question if possible
  const allOpts = shuffleQuiz(wordSteps.map(w => ({ word: w.word, emoji: w.emoji })));
  if (allOpts.length >= 3) {
    const pick = allOpts[0];
    if (pick) {
      const wrong = shuffleQuiz(allOpts.filter(o => o.word !== pick.word)).slice(0, 2);
      questions.push({
        question: `Where is ${pick.word}?`,
        correctWord: pick.word,
        correctEmoji: pick.emoji,
        options: shuffleQuiz([pick, ...wrong]),
      });
    }
  }

  return shuffleQuiz(questions).slice(0, 5);
}

const animVariants: Record<string, object> = {
  bounce: { y: [0, -30, 0], transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } },
  pop: { scale: [0.8, 1.1, 1], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } },
  spin: { rotate: [0, 15, -15, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
  wiggle: { rotate: [-5, 5, -5], transition: { duration: 0.5, repeat: Infinity } },
  float: { y: [0, -15, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
  pulse: { scale: [1, 1.15, 1], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } },
  swing: { rotate: [-8, 8, -8], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  shake: { x: [-6, 6, -6, 6, 0], transition: { duration: 0.5, repeat: Infinity } },
  jump: { y: [0, -40, 0], transition: { duration: 0.7, repeat: Infinity, ease: 'easeOut' } },
};

function StepEmoji({ emoji, anim }: { emoji: string; anim?: string }) {
  const variant = anim && animVariants[anim] ? animVariants[anim] : {};
  return (
    <motion.div
      animate={variant as any}
      className="text-[5rem] sm:text-[6rem] drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]"
    >
      {emoji}
    </motion.div>
  );
}

function PhonicsWordCard({ word, family, emoji }: { word: string; family?: string; emoji: string }) {
  if (!family) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl sm:text-5xl">{emoji}</span>
        <div className="bg-white/40 backdrop-blur-md rounded-xl px-4 sm:px-6 py-2 border-2 border-white/50 shadow-lg">
          <span className="text-3xl sm:text-4xl font-black text-indigo-950 tracking-wider">{word}</span>
        </div>
      </div>
    );
  }

  const fi = word.toLowerCase().indexOf(family);
  const prefix = fi > 0 ? word.slice(0, fi) : '';
  const famPart = fi >= 0 ? word.slice(fi, fi + family.length) : '';

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-4xl sm:text-5xl"
      >
        {emoji}
      </motion.div>
      <div className="bg-white/40 backdrop-blur-md rounded-xl px-4 sm:px-6 py-2 border-2 border-white/50 shadow-lg flex items-center gap-0">
        <span className="text-3xl sm:text-4xl font-black tracking-wider">
          {prefix && <span className="text-indigo-500">{prefix}</span>}
          {famPart && (
            <span className="text-amber-400 bg-amber-500/20 px-1 rounded-lg drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              {famPart}
            </span>
          )}
        </span>
      </div>
      <div className="bg-amber-400/30 backdrop-blur-sm rounded-full px-4 py-1 border border-white/40">
        <span className="text-sm sm:text-base font-black text-amber-700 tracking-wider">'{family}'</span>
      </div>
    </div>
  );
}

function TutorialPlayer({
  lesson,
  onClose,
  onComplete,
  studentName,
}: {
  lesson: Lesson;
  onClose: () => void;
  onComplete: () => void;
  studentName?: string;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [quizPhase, setQuizPhase] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [wrongTap, setWrongTap] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const visuals = getLessonVisuals(lesson.title);
  const steps = useMemo(() => buildTutorial(lesson.title, studentName), [lesson.title, studentName]);
  const step = steps[stepIndex];
  const quizQuestions = useMemo(() => generateQuiz(steps), [steps]);

  useEffect(() => {
    if (!quizPhase && !completed) {
      const timer = setTimeout(() => {
        audioEngine?.speak(step.speak);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, step.speak, quizPhase, completed]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Steps done → start quiz
      if (quizQuestions.length > 0) {
        setQuizPhase(true);
        setQuizIndex(0);
        setQuizScore(0);
        audioEngine?.speak("Now let's play a quick game! Tap the right picture!");
      } else {
        setCompleted(true);
        audioEngine?.speak('Great job! You finished the lesson!');
      }
    }
  };

  const handleQuizAnswer = (correct: boolean) => {
    if (correct) {
      const newScore = quizScore + 1;
      setQuizScore(newScore);
      if (quizIndex < quizQuestions.length - 1) {
        setQuizIndex(quizIndex + 1);
        setWrongTap(false);
      } else {
        setQuizDone(true);
        const msg = newScore >= quizQuestions.length * 0.6
          ? `You got ${newScore} out of ${quizQuestions.length}! Amazing! ⭐`
          : `Good try! You got ${newScore} out of ${quizQuestions.length}! Keep learning! 🌟`;
        audioEngine?.speak(msg);
      }
    } else {
      setWrongTap(true);
      setTimeout(() => setWrongTap(false), 500);
    }
  };

  const handleQuizFinish = () => {
    onComplete();
    onClose();
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleDragStart = (x: number) => setDragStart(x);

  const handleDragEnd = (x: number) => {
    const dx = x - dragStart;
    if (Math.abs(dx) > 50) {
      if (dx > 0) handlePrev();
      else handleNext();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const handleMouseUp = (e: React.MouseEvent) => handleDragEnd(e.clientX);
  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => handleDragEnd(e.changedTouches[0].clientX);

  const handleReplay = () => setStepIndex(0);

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white/20 backdrop-blur-md border-b border-white/20">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-indigo-950 font-black px-4 py-2 bg-white/60 border border-white/80 rounded-2xl shadow-lg hover:bg-white/80 transition-all"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => audioEngine?.speak(step.speak)}
            className="p-3 bg-white/60 border border-white/80 rounded-full shadow-lg hover:bg-white/80 transition-all"
          >
            <Volume2 size={22} className="text-indigo-950" />
          </button>
        </div>
      </div>

      {/* Progress dots - only for tutorial steps */}
      {!quizPhase && !completed && (
        <div className="flex items-center justify-center gap-2 py-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-3 rounded-full transition-all duration-300 ${
                idx === stepIndex ? `w-8 bg-white shadow-lg` : idx < stepIndex ? 'w-3 bg-emerald-300' : 'w-3 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Quiz header */}
      {quizPhase && !quizDone && (
        <div className="flex items-center justify-center gap-2 py-4">
          <span className="text-sm font-black text-white/70 bg-white/20 rounded-full px-4 py-1">
            Quiz {quizIndex + 1} / {quizQuestions.length} {quizScore > 0 && `⭐${quizScore}`}
          </span>
        </div>
      )}

      {/* Main content */}
      {!completed && !quizPhase && (
        <>
        </>
      )}

      <div
        className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 sm:px-8 pb-4 select-none overflow-hidden"
        onTouchStart={!quizPhase && !completed ? handleTouchStart : undefined}
        onTouchEnd={!quizPhase && !completed ? handleTouchEnd : undefined}
        onMouseDown={!quizPhase && !completed ? handleMouseDown : undefined}
        onMouseUp={!quizPhase && !completed ? handleMouseUp : undefined}
      >
        <AnimatePresence mode="wait">
          {!completed && !quizPhase && (
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-3xl"
            >
              <div className={`relative bg-white/30 backdrop-blur-2xl border-4 border-white/50 rounded-[3rem] p-4 sm:p-6 shadow-2xl overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${visuals.color} opacity-20`} />
                <div className="relative z-10 flex flex-col items-center text-center gap-2 sm:gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-indigo-950 leading-tight">
                    {step.title}
                  </h2>

                  <div className="w-full min-h-0 max-h-[200px] sm:max-h-[280px] flex items-center justify-center">
                    {step.word ? (
                      <PhonicsWordCard word={step.word} family={step.family} emoji={step.emoji} />
                    ) : (
                      <StepEmoji emoji={step.emoji} anim={step.anim} />
                    )}
                  </div>

                  <p className="text-sm sm:text-lg font-bold text-indigo-900/80 line-clamp-2">
                    {step.speak}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── QUIZ PHASE ─── */}
          {quizPhase && !quizDone && (
            <motion.div
              key={`quiz-${quizIndex}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="w-full max-w-lg"
            >
              <div className="bg-white/30 backdrop-blur-2xl border-4 border-white/50 rounded-[3rem] p-6 sm:p-8 shadow-2xl text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 mb-2">
                  🤔 {quizQuestions[quizIndex]?.question}
                </h2>
                <motion.div
                  animate={wrongTap ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xs mx-auto mt-6">
                    {quizQuestions[quizIndex]?.options.map((opt) => (
                      <motion.button
                        key={opt.word}
                        whileHover={{ scale: 1.08, y: -4 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleQuizAnswer(opt.word === quizQuestions[quizIndex].correctWord)}
                        className="flex flex-col items-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-2xl bg-white/25 backdrop-blur-md border-2 border-white/40 hover:bg-white/35 transition-all shadow-lg"
                      >
                        <span className="text-5xl sm:text-6xl">{opt.emoji}</span>
                        <span className="text-[10px] sm:text-xs font-black text-white/80 uppercase tracking-wider">{opt.word}</span>
                      </motion.button>
                    ))}
                  </div>
                  {wrongTap && (
                    <p className="text-sm font-black text-yellow-200 mt-4">🙅 Tap the right one!</p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ─── QUIZ DONE ─── */}
          {quizPhase && quizDone && (
            <motion.div
              key="quizdone"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <div className="bg-white/40 backdrop-blur-2xl border-4 border-white/60 rounded-[3rem] p-8 sm:p-12 shadow-2xl text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-8xl sm:text-9xl mb-4"
                >
                  {quizScore >= Math.ceil(quizQuestions.length * 0.6) ? '🏆' : '🌟'}
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-black text-indigo-950 mb-2">Quiz done!</h2>
                <p className="text-xl font-bold text-indigo-900/70 mb-6">
                  {quizScore} / {quizQuestions.length} correct
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => { setQuizIndex(0); setQuizScore(0); setQuizDone(false); setWrongTap(false); }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/70 border-2 border-white/80 rounded-2xl text-indigo-950 font-black shadow-xl hover:bg-white/90 transition-all"
                  >
                    <RotateCcw size={20} /> Again
                  </button>
                  <button
                    onClick={handleQuizFinish}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-600 transition-all"
                  >
                    <CheckCircle size={20} /> Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── COMPLETED ─── */}
          {completed && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <div className="bg-white/40 backdrop-blur-2xl border-4 border-white/60 rounded-[3rem] p-8 sm:p-12 shadow-2xl text-center">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-8xl sm:text-9xl mb-6"
                >
                  🏆
                </motion.div>
                <h2 className="text-4xl sm:text-5xl font-black text-indigo-950 mb-4">You did it!</h2>
                <p className="text-xl sm:text-2xl font-bold text-indigo-900/70 mb-8">
                  You finished learning {lesson.title}!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleReplay}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/70 border-2 border-white/80 rounded-2xl text-indigo-950 font-black shadow-xl hover:bg-white/90 transition-all"
                  >
                    <RotateCcw size={22} /> Play Again
                  </button>
                  <button
                    onClick={handleFinish}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-600 transition-all"
                  >
                    <CheckCircle size={22} /> Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls — only for tutorial steps */}
      {!quizPhase && !completed && (
        <div className="px-4 sm:px-8 pb-8 pt-2">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className={`px-6 py-4 rounded-2xl font-black shadow-lg transition-all ${
                stepIndex === 0
                  ? 'bg-white/30 text-indigo-900/30 cursor-not-allowed'
                  : 'bg-white/60 text-indigo-950 hover:bg-white/80'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black shadow-xl text-white transition-all bg-gradient-to-r ${visuals.color} hover:brightness-110 active:scale-95`}
            >
              {stepIndex === steps.length - 1 ? (
                <><CheckCircle size={24} /> Quiz Time!</>
              ) : (
                <><Play size={24} /> Next</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UltimateLearnEngine() {
  const { subjects, studentProfile, updateProgress, refetchLessons } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const subjectParam = searchParams.get('subject');
  const chapterParam = searchParams.get('chapter');

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'hub' | 'chapter'>(subjectParam && chapterParam ? 'chapter' : 'hub');
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(subjectParam);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(chapterParam);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showNameTrace, setShowNameTrace] = useState(false);
  const [traceRounds, setTraceRounds] = useState<{ type: 'guide' | 'trace'; path: string }[] | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundPassed, setRoundPassed] = useState<number[]>([]);
  const [traceDone, setTraceDone] = useState(false);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointLessonId, setCheckpointLessonId] = useState<string | null>(null);
  const [checkpointTitle, setCheckpointTitle] = useState('');

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    audioEngine?.warmUp();
    return () => cancelAnimationFrame(timer);
  }, []);

  const activeSubject = useMemo(() =>
    subjects.find(s => s.id === activeSubjectId), [activeSubjectId, subjects]);
  const activeChapter = useMemo(() =>
    activeSubject?.chapters.find(c => c.id === activeChapterId), [activeSubject, activeChapterId]);

  const openSubject = (subject: typeof subjects[0]) => {
    const visuals = getSubjectVisuals(subject.name);
    audioEngine?.speak(visuals.sound);
    setActiveSubjectId(subject.id);
    setView('chapter');
  };

  const openChapter = (chapter: Chapter) => {
    if (!chapter.is_unlocked) {
      audioEngine?.speak("Complete the previous chapter first!");
      return;
    }
    setActiveChapterId(chapter.id);

    // ── Prefetch all lesson activities for this chapter (staggered) ──
    if (chapter.lessons?.length) {
      chapter.lessons.forEach((lesson, i) => {
        setTimeout(() => {
          queryClient.prefetchQuery({
            queryKey: studentKeys.activities(lesson.id),
            queryFn: () => studentApi.getLessonActivities(lesson.id),
            staleTime: 5 * 60 * 1000,
          });
        }, i * 200); // 200ms stagger — first one fires immediately
      });
    }
  };

  const closeChapter = () => {
    setActiveChapterId(null);
    setView('hub');
    router.push(`/${window.location.pathname.split('/')[1]}/student/Learn`, { scroll: true });
  };

  const goBackToChapters = () => {
    setActiveChapterId(null);
    setActiveLesson(null);
  };

  const speakText = (text: string) => audioEngine?.speak(text);

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.is_unlocked) return;
    speakText(lesson.title);
    setActiveLesson(lesson);

    const lower = lesson.title.toLowerCase();

    // "My Name Writing" → direct name tracing
    if (lower.includes('name')) {
      setShowNameTrace(true);
      return;
    }

    // Letter Checkpoint games
    if (lower.includes('find the letter') || lower.includes('pop the balloon') || lower.includes('pick the card') || lower.includes('checkpoint')) {
      setCheckpointLessonId(lesson.id);
      setCheckpointTitle(lesson.title);
      setShowCheckpoint(true);
      setActiveLesson(null);
      return;
    }

    // Pre-writing foundation strokes → trace → quiz (all trace, no buttons)
    if (lower.includes('standing') || lower.includes('sleeping') || lower.includes('slanting') ||
        lower.includes('curved') || lower.includes('curve') || lower.includes('zig') || lower.includes('zag') ||
        lower.includes('s-curve') || lower.includes('circle') ||
        lower.includes('exam') || lower.includes('review') || lower.includes('assessment') || lower.includes('mix') ||
        lower.includes('left-slanting') || lower.includes('right-slanting') ||
        lower.includes('left-curve') || lower.includes('right-curve') ||
        lower.includes('up-curve') || lower.includes('down-curve') ||
        lower.includes('up curve') || lower.includes('down curve')) {
      // Mixed exam — all CBSE strokes as trace rounds
      if (lower.includes('exam') || lower.includes('review') || lower.includes('assessment') || lower.includes('mix')) {
        const shuffled = [...QUIZ_STROKES].sort(() => Math.random() - 0.5).slice(0, EXAM_COUNT);
        setTraceRounds(shuffled.map(p => ({ type: 'trace' as const, path: p })));
        setRoundIndex(0);
        setRoundPassed([]);
        setTraceDone(false);
        return;
      }
      // Individual stroke path map (CBSE names with backward compat)
      const pathMap: Record<string, string> = {
        standing: 'standing', sleeping: 'sleeping',
        'left slanting': 'left-slanting', 'right slanting': 'right-slanting',
        'left curve': 'left-curve', 'right curve': 'right-curve',
        'up curve': 'up-curve', 'down curve': 'down-curve',
        'left-curve': 'left-curve', 'right-curve': 'right-curve',
        'up-curve': 'up-curve', 'down-curve': 'down-curve',
        'left-slanting': 'left-slanting', 'right-slanting': 'right-slanting',
        slanting: 'left-slanting', curved: 'up-curve',
        zig: 'zigzag', zag: 'zigzag',
        's-curve': 's-curve', circle: 'circle',
      };
      let path = '';
      for (const [key, p] of Object.entries(pathMap)) {
        if (lower.includes(key)) { path = p; break; }
      }
      if (path) {
        setTraceRounds([{ type: 'guide', path }, { type: 'trace', path }]);
        setRoundIndex(0);
        setRoundPassed([]);
        setTraceDone(false);
        setActiveLesson(null);
      }
      return;
    }

    queryClient.prefetchQuery({
      queryKey: studentKeys.activities(lesson.id),
      queryFn: () => studentApi.getLessonActivities(lesson.id),
      staleTime: 5 * 60 * 1000,
    });

    // ── Prefetch next lesson's activities for instant transition ──
    const ch = subjects
      .flatMap(s => s.chapters)
      .find(c => c.id === activeChapterId);
    if (ch?.lessons) {
      const currentIdx = ch.lessons.findIndex(l => l.id === lesson.id);
      if (currentIdx >= 0 && currentIdx < ch.lessons.length - 1) {
        const nextLesson = ch.lessons[currentIdx + 1];
        queryClient.prefetchQuery({
          queryKey: studentKeys.activities(nextLesson.id),
          queryFn: () => studentApi.getLessonActivities(nextLesson.id),
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  };

  const handleActivityComplete = () => {
    refetchLessons();
    setActiveLesson(null);
  };

  const handleNameTraceComplete = () => {
    setShowNameTrace(false);
    setActiveLesson(null);
    refetchLessons();
  };

  const studentName = studentProfile?.name || 'Explorer';
  const level = studentProfile?.current_streak_days || 0;

  if (!mounted) return null;

  return (
    <div className="relative font-sans overflow-hidden bg-sky-400">
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500" />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/30 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full pt-0">
        <div className="w-full">
          <div className="relative px-0">
             <div className="relative w-full flex items-center overflow-hidden pt-10 pb-10 sm:pt-14 sm:pb-12 border-b-8 border-white/10">
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/30 to-transparent skew-x-[-20deg] transform translate-x-32" />
                <div className="absolute top-10 left-[10%] text-6xl opacity-40 animate-bounce cursor-default">☁️</div>
                <div className="absolute bottom-20 left-[30%] text-4xl opacity-30 animate-pulse cursor-default">☁️</div>
                <div className="absolute top-20 right-[40%] text-8xl opacity-30 animate-bounce cursor-default" style={{ animationDelay: '1s' }}>☁️</div>

                <div className="relative z-20 w-full px-6 sm:px-16 flex flex-col md:flex-row items-center justify-between gap-12">
                   <div className="flex-1 space-y-6 text-center md:text-left">
                      <motion.div
                        initial={{ opacity: 1, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20"
                      >
                         <Star size={16} fill="currentColor" /> Level {level} Legend
                      </motion.div>

                      <h1 className="text-5xl sm:text-8xl font-black text-indigo-950 leading-[0.9] tracking-tighter drop-shadow-sm">
                         READY FOR A <br/>
                         <span className="text-indigo-800">MISSION, {studentName.toUpperCase()}?</span>
                      </h1>

                      <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                         <div className="px-8 py-4 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                               <Zap size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                               <p className="text-[10px] font-black text-indigo-950 uppercase leading-none mb-1">Status</p>
                               <p className="text-sm font-black text-indigo-900">Hyper Active 🔥</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="relative group">
                      <div className="absolute inset-0 bg-white/40 blur-[100px] rounded-full group-hover:bg-white/60 transition-all duration-500" />
                      <div className="relative w-64 h-64 sm:w-[450px] sm:h-[450px] drop-shadow-[0_45px_45px_rgba(0,0,0,0.15)] transform group-hover:scale-110 transition-transform duration-700">
                         <img
                           src="/assets/avatars/owl-removebg-preview.png"
                           className="w-full h-full object-contain animate-[float_4s_ease-in-out_infinite]"
                           alt="Mission Master Owl"
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <AnimatePresence mode="wait">
            {view === 'hub' ? (
              <motion.div
                key="hub"
                initial={{ opacity: 1, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="px-4 sm:px-12 mb-20">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/60 shadow-lg">
                         <MapIcon className="text-indigo-950" size={20} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-indigo-950 leading-none">Discovery Worlds</h2>
                         <p className="text-[10px] font-bold text-indigo-950/40 uppercase tracking-widest mt-1">Tap a picture to play</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                     {subjects.length === 0 ? (
                       <div className="col-span-full text-center py-20">
                         <p className="text-white/60 font-black text-lg">No worlds loaded yet. Start your journey!</p>
                       </div>
                     ) : (
                       subjects.map((subject, idx) => {
                         const v = getSubjectVisuals(subject.name);
                         const total = subject.chapters.length;

                         return (
                           <motion.button
                             key={subject.id}
                             onClick={() => openSubject(subject)}
                             whileHover={{ y: -8, scale: 1.02 }}
                             whileTap={{ scale: 0.95 }}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.05 }}
                             className={`group relative rounded-[2.5rem] p-1.5 border-2 transition-all duration-500 backdrop-blur-3xl shadow-xl ${v.shadow} hover:shadow-2xl ${v.bg} ${v.border}`}
                           >
                             <div className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${v.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-xl`} />
                             <div className="relative min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center p-6 rounded-[2.2rem] overflow-hidden bg-white/40">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/50 blur-3xl rounded-full" />

                                {/* Floating mascot */}
                                <motion.div
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 2.5 + (idx % 3) * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                                  className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center mb-4"
                                >
                                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${v.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
                                  <span className="relative text-7xl sm:text-8xl drop-shadow-[0_20px_20px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                                    {v.mascot}
                                  </span>
                                </motion.div>

                                {/* Small icon badge */}
                                <div className="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border border-white/60 text-lg">
                                  {v.emoji}
                                </div>

                                {/* Minimal text */}
                                <div className="text-center z-10">
                                   <h3 className="text-xl sm:text-2xl font-black text-indigo-950 uppercase tracking-tighter leading-none mb-1">{v.label}</h3>
                                   <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest">
                                     {total} {total === 1 ? 'level' : 'levels'}
                                   </p>
                                </div>

                                {/* Tiny progress dots */}
                                {total > 0 && (
                                  <div className="absolute bottom-5 left-6 right-6 flex items-center justify-center gap-1.5">
                                    {subject.chapters.slice(0, Math.min(total, 8)).map((ch) => (
                                      <div
                                        key={ch.id}
                                        className={`h-2 rounded-full transition-all ${
                                          ch.completion_percentage >= 100
                                            ? `w-4 bg-gradient-to-r ${v.color}`
                                            : 'w-2 bg-indigo-950/10'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                             </div>
                           </motion.button>
                         );
                       })
                     )}
                   </div>
                </div>
              </motion.div>
            ) : activeSubject && (
              <motion.div
                key="chapters"
                initial={{ opacity: 1, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="px-4 sm:px-12 pb-20"
              >
                {!activeChapterId ? (
                  <>
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
                      <button
                        onClick={closeChapter}
                        className="inline-flex items-center gap-2 text-indigo-950 font-black px-6 py-3 bg-white/40 border border-white/60 rounded-2xl shadow-xl hover:bg-white/60 transition-all"
                      >
                        <ArrowLeft size={18} /> Back
                      </button>
                      <div className="text-center sm:text-right">
                        <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter leading-none">{activeSubject.name}</h2>
                        <p className="text-[10px] font-black text-indigo-950/40 uppercase tracking-widest mt-1">Pick a level</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                      {activeSubject.chapters.map((chapter, idx) => {
                      const visuals = getChapterVisuals(chapter.name);
                      return (
                        <motion.button
                          key={chapter.id}
                          onClick={() => openChapter(chapter)}
                          disabled={!chapter.is_unlocked}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={chapter.is_unlocked ? { y: -6, scale: 1.02 } : {}}
                          whileTap={chapter.is_unlocked ? { scale: 0.97 } : {}}
                          className={`relative text-left bg-white/40 backdrop-blur-2xl border-2 rounded-[2.5rem] p-5 shadow-xl transition-all overflow-hidden group ${
                            chapter.is_unlocked
                              ? 'border-white/60 hover:bg-white/60 active:scale-[0.98]'
                              : 'border-gray-300/30 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <motion.div
                              animate={chapter.is_unlocked ? { y: [0, -8, 0] } : {}}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                              className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-xl mb-4 transition-transform group-hover:scale-110 border-4 border-white ${
                                chapter.is_unlocked
                                  ? chapter.completion_percentage >= 100
                                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white'
                                    : `bg-gradient-to-br ${visuals.color} text-white`
                                  : 'bg-gray-200'
                              }`}
                            >
                              {chapter.is_unlocked ? (
                                visuals.mascot
                              ) : (
                                <Lock size={32} className="text-gray-400" />
                              )}
                            </motion.div>

                            <h3 className={`text-lg sm:text-xl font-black tracking-tight mb-1 ${
                              chapter.is_unlocked ? 'text-indigo-950' : 'text-gray-500'
                            }`}>
                              {chapter.name}
                            </h3>

                            {!chapter.is_unlocked && (
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-200 rounded-full mb-2">🔒 Locked</span>
                            )}
                            {chapter.is_unlocked && chapter.completion_percentage >= 100 && (
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-100 rounded-full mb-2">⭐ Done</span>
                            )}

                            {chapter.is_unlocked && chapter.completion_percentage > 0 && chapter.completion_percentage < 100 && (
                              <div className="w-full h-2.5 bg-indigo-950/10 rounded-full overflow-hidden mt-3">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${chapter.completion_percentage}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${visuals.color}`}
                                />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                    </>
                ) : activeChapter && (
                  /* Lessons within a chapter */
                  <div>
                    <button
                      onClick={goBackToChapters}
                      className="inline-flex items-center gap-2 text-indigo-950 font-black px-6 py-3 bg-white/40 border border-white/60 rounded-2xl shadow-xl hover:bg-white/60 transition-all mb-10"
                    >
                      <ArrowLeft size={18} /> Back
                    </button>

                    <div className="text-center mb-12">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-[2rem] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl shadow-xl border-4 border-white mb-4"
                      >
                        {getChapterVisuals(activeChapter.name).mascot}
                      </motion.div>
                      <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">{activeChapter.name}</h2>
                      <p className="text-[11px] font-bold text-indigo-950/50 mt-2">
                        {activeChapter.completed_lessons}/{activeChapter.total_lessons} lessons
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                      {activeChapter.lessons.map((lesson) => {
                        const visuals = getLessonVisuals(lesson.title);
                        return (
                          <motion.button
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson)}
                            disabled={!lesson.is_unlocked}
                            whileHover={lesson.is_unlocked ? { y: -6, scale: 1.02 } : {}}
                            whileTap={lesson.is_unlocked ? { scale: 0.97 } : {}}
                            className={`relative bg-white/40 backdrop-blur-2xl border-2 rounded-[2.5rem] p-5 text-center shadow-xl transition-all overflow-hidden group ${
                              lesson.is_unlocked
                                ? 'border-white/60 hover:bg-white/60 active:scale-95'
                                : 'border-gray-300/30 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative inline-block mb-4">
                              <motion.div
                                animate={lesson.is_unlocked ? { y: [0, -6, 0] } : {}}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] flex items-center justify-center text-5xl sm:text-6xl shadow-xl border-4 border-white transform group-hover:scale-110 transition-transform duration-500 ${
                                  lesson.is_unlocked
                                    ? `bg-gradient-to-br ${visuals.color} text-white`
                                    : 'bg-gray-200 grayscale'
                                }`}
                              >
                                {lesson.is_unlocked ? visuals.mascot : '🔒'}
                              </motion.div>
                              {lesson.progress?.status === 'completed' && (
                                <div className="absolute -top-2 -right-2">
                                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <CheckCircle size={20} className="text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <h3 className={`text-base sm:text-lg font-black mb-1 tracking-tight ${
                              lesson.is_unlocked ? 'text-indigo-950' : 'text-gray-500'
                            }`}>
                              {lesson.title}
                            </h3>
                            {lesson.description && (
                              <p className="text-[10px] font-bold text-indigo-900/40 mb-3 leading-tight line-clamp-1">{lesson.description}</p>
                            )}
                            <div className={`w-full py-2.5 rounded-2xl text-[10px] font-black shadow-lg flex items-center justify-center gap-2 transition-all ${
                              lesson.progress?.status === 'completed'
                                ? 'bg-emerald-500 text-white'
                                : lesson.progress?.status === 'in_progress'
                                ? 'bg-amber-500 text-white'
                                : lesson.is_unlocked
                                ? `bg-gradient-to-r ${visuals.color} text-white group-hover:brightness-110`
                                : 'bg-gray-300 text-gray-500'
                            }`}>
                              {lesson.progress?.status === 'completed' ? 'DONE ✅' :
                               lesson.progress?.status === 'in_progress' ? 'PLAY ▶' :
                               lesson.is_unlocked ? 'START' : '🔒 LOCKED'}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showCheckpoint && checkpointLessonId && (
        <LetterCheckpoint
          lessonId={checkpointLessonId}
          lessonTitle={checkpointTitle}
          onClose={() => { setShowCheckpoint(false); setCheckpointLessonId(null); setCheckpointTitle(''); }}
          onComplete={() => { setShowCheckpoint(false); setCheckpointLessonId(null); setCheckpointTitle(''); refetchLessons(); }}
        />
      )}

      {activeLesson && !showNameTrace && (
        <ActivityPlayer
          key={activeLesson.id}
          lessonId={activeLesson.id}
          lessonTitle={activeLesson.title}
          onClose={() => setActiveLesson(null)}
          onComplete={handleActivityComplete}
        />
      )}

      {/* ─── NAME TRACING ACTIVITY ─── */}
      {showNameTrace && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500">
          <div className="relative w-full max-w-lg mx-3 my-4 overflow-hidden rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] bg-white/95">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #013237 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <span className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest">✏️ Name Writing</span>
                <button
                  onClick={() => { setShowNameTrace(false); setActiveLesson(null); }}
                  className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-500 text-base font-bold transition-all"
                >
                  &times;
                </button>
              </div>
              <NameTraceActivity
                config={{}}
                studentName={studentName}
                onComplete={() => handleNameTraceComplete()}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── PRE-WRITING TRACE ROUNDS ─── */}
      {traceRounds && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="relative w-full max-w-lg sm:max-w-2xl mx-2 sm:mx-4 my-2 sm:my-4 overflow-hidden rounded-2xl sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)]"
            style={{ background: 'linear-gradient(145deg, #7dd3fc, #38bdf8, #3b82f6)' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
            {!traceDone ? (() => {
              const cur = traceRounds[roundIndex];
              const isGuide = cur.type === 'guide';
              const path = cur.path;
              const guideColors: Record<string, string> = {
                standing: '#6366F1', sleeping: '#22C55E', 'left-slanting': '#F59E0B', 'right-slanting': '#F97316',
                'left-curve': '#8B5CF6', 'right-curve': '#EC4899', 'up-curve': '#06B6D4', 'down-curve': '#10B981',
              };
              return (
                <>
                  <div className="flex items-center justify-between px-3 sm:px-5 pt-3 sm:pt-5 pb-0">
                    <span className="text-white/50 text-xs font-bold">
                      {roundIndex + 1} / {traceRounds.length}
                    </span>
                    <button onClick={() => { setTraceRounds(null); setActiveLesson(null); }}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white/60 hover:text-white text-base sm:text-lg font-bold transition-all">&times;</button>
                  </div>
                  <p className="text-center text-white/70 font-bold text-xs mt-1">
                    {isGuide ? `👀 ${STROKE_LABELS[path] || path}` : `✏️ ${STROKE_LABELS[path] || path}`}
                  </p>
                  {isGuide ? (
                    <PreWritingVideo key={`${roundIndex}-${path}`}
                      config={{ path, color: guideColors[path] || '#8B5CF6' }}
                      onComplete={() => {
                        setRoundPassed(prev => [...prev, 100]);
                        if (roundIndex < traceRounds.length - 1) setRoundIndex(i => i + 1);
                        else setTraceDone(true);
                      }}
                    />
                  ) : (
                    <TraceActivity
                      key={`${roundIndex}-${path}`}
                      config={{ path }}
                      onComplete={(data) => {
                        const acc = Number(data.completion_data?.accuracy) || 0;
                        setRoundPassed(prev => [...prev, acc]);
                        if (roundIndex < traceRounds.length - 1) setRoundIndex(i => i + 1);
                        else setTraceDone(true);
                      }}
                    />
                  )}
                </>
              );
            })() : (
              <motion.div key="score" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 px-6 py-10">
                <span className="text-6xl">
                  {roundPassed.every(a => a >= 70) ? '🎉' : '💪'}
                </span>
                <p className="text-xl font-black text-white">
                  {roundPassed.every(a => a >= 70) ? 'Super!' : 'Nice try!'}
                </p>
                <p className="text-white/60 font-bold text-sm">
                  Avg: {Math.round(roundPassed.reduce((s, a) => s + a, 0) / roundPassed.length)}%
                </p>
                <button onClick={() => { setTraceRounds(null); setActiveLesson(null); refetchLessons(); }}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-full shadow-lg transition-all">
                  Done ✅
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
