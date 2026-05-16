import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: number;
  light?: boolean;
  giant?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 120, light = false, giant = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} style={{ width: giant ? 'auto' : size }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center"
      >
        {/* "Axyntra" Text */}
        <span className={`font-bold tracking-tight ${giant ? 'text-7xl md:text-9xl' : 'text-2xl'} ${light ? 'text-white' : 'text-white'}`}>
          Axyntra
        </span>
        
        {/* Stylized "X" with Arrow */}
        <div className={`relative flex items-center justify-center animate-logo-pulse ${giant ? 'ml-2' : 'ml-[1px]'}`}>
          <span className={`font-black text-[#00D4FF] relative z-10 ${giant ? 'text-8xl md:text-[10rem]' : 'text-3xl'}`}>
            X
          </span>
          
          {/* Arrow Tip integrated into the top-right stroke of the X */}
          <div className={`absolute border-l-transparent border-b-[#00D4FF] rotate-[45deg] ${
            giant 
              ? 'top-[10px] right-[-15px] border-l-[20px] border-b-[35px] shadow-[0_0_30px_rgba(0,212,255,0.6)]' 
              : 'top-[2px] right-[-4px] border-l-[6px] border-b-[10px] shadow-[0_0_10px_rgba(0,212,255,0.4)]'
          }`} />
          
          {/* Scanning light effect overlay */}
          <div className="absolute inset-0 animate-scan pointer-events-none rounded-lg" />
        </div>
      </motion.div>
      
      {/* Subtitle "Automation" */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`font-medium tracking-[0.2em] text-slate-400 ${giant ? 'text-xl md:text-3xl mt-2' : 'text-[10px] mt-0'}`}
      >
        Automation
      </motion.div>
    </div>
  );
};
