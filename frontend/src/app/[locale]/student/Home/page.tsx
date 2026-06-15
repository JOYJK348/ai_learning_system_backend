'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DashboardHome from './DashboardHome';
import MediaWorld from '../_components/MediaWorld';

export default function HomePage() {
  return (
    <motion.div 
      initial={{ opacity: 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* 🗺️ SECTION 1: World Map Adventure (Gaming Hub) */}
      <DashboardHome />

      {/* 🎵📺 SECTION 2: Rhyme Radio + Magic Cinema (Entertainment Hub) */}
      <div className="w-full bg-white relative z-20">
        <MediaWorld />
      </div>

    </motion.div>
  );
}
