import React from 'react';

interface MoshModeLogoProps {
  className?: string;
}

export const MoshModeLogo: React.FC<MoshModeLogoProps> = ({
  className = 'h-10 w-auto'
}) => {
  return (
    <img
      src="/logo.png"
      alt="MOSH & MODE"
      className={className}
    />
  );
};
