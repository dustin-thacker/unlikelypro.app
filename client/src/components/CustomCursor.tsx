import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      const isClickable = target.tagName === 'A' || 
                         target.tagName === 'BUTTON' ||
                         target.onclick !== null ||
                         target.style.cursor === 'pointer' ||
                         window.getComputedStyle(target).cursor === 'pointer';
      setIsPointer(isClickable);
    };

    window.addEventListener('mousemove', updatePosition);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
    };
  }, []);

  return (
    <>
      {/* Main cursor dot */}
      <div
        className="custom-cursor-dot"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isPointer ? '32px' : '12px',
          height: isPointer ? '32px' : '12px',
        }}
      />
      {/* Cursor ring */}
      <div
        className="custom-cursor-ring"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isPointer ? '48px' : '40px',
          height: isPointer ? '48px' : '40px',
        }}
      />
    </>
  );
}
