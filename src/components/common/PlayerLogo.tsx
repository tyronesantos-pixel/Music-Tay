import React from 'react';

interface PlayerLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const PlayerLogo: React.FC<PlayerLogoProps> = ({
  size = 'md',
  className = '',
  animate = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-11 h-11',
  };

  return (
    <div
      className={`relative ${sizeMap[size]} rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/25 flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <div className="w-full h-full rounded-[15px] bg-[#14121d] flex items-center justify-center relative overflow-hidden group">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/30 via-indigo-500/20 to-cyan-400/20 opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Custom Tyrone Player Audio-Prism Icon */}
        <svg
          className={`${iconSizeMap[size]} text-white relative z-10`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sound bars left */}
          <rect
            x="3"
            y="9"
            width="2.5"
            height="6"
            rx="1.25"
            className="fill-cyan-400"
          />
          <rect
            x="7"
            y="6"
            width="2.5"
            height="12"
            rx="1.25"
            className={`fill-indigo-400 ${animate ? 'animate-pulse' : ''}`}
          />

          {/* Dynamic Play Prism Triangle */}
          <path
            d="M12.5 7.2C12.5 6.4 13.4 5.9 14.1 6.3L19.8 10.1C20.4 10.5 20.4 11.5 19.8 11.9L14.1 15.7C13.4 16.1 12.5 15.6 12.5 14.8V7.2Z"
            className="fill-violet-400 drop-shadow-[0_2px_8px_rgba(167,139,250,0.8)]"
          />

          {/* Glowing frequency accent dot */}
          <circle cx="16" cy="18" r="1" className="fill-cyan-300" />
        </svg>
      </div>
    </div>
  );
};
