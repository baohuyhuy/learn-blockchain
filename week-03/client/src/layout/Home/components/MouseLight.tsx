import React, { useState, useEffect } from 'react';

type MouseLightProps = {
  color?: string;
  size?: number;
  opacity?: number;
  blur?: number;
};

const MouseLight: React.FC<MouseLightProps> = ({
  color = '#3470ff',
  size = 300,
  opacity = 0.15,
  blur = 40
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      if (!isVisible) {
        setIsVisible(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
        opacity: opacity,
        zIndex: 10,
        filter: `blur(${blur}px)`,
        transition: 'transform 0.1s ease-out',
        transform: 'translate(0, 0)',
      }}
    />
  );
};

export default MouseLight;