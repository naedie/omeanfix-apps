import React from 'react';

/**
 * Creates a modern, tactile ripple effect on button click.
 * Automatically adds the .ripple-btn class to ensure proper clipping.
 */
export function triggerRipple(e: React.MouseEvent<HTMLElement>) {
  const button = e.currentTarget;
  if (!button) return;

  if (!button.classList.contains('ripple-btn')) {
    button.classList.add('ripple-btn');
  }

  const rect = button.getBoundingClientRect();
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const circle = document.createElement('span');
  circle.style.width = `${diameter}px`;
  circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.className = 'ripple-effect';

  // Remove previous ripple if still active on rapid clicks
  const prevRipple = button.querySelector('.ripple-effect');
  if (prevRipple) {
    prevRipple.remove();
  }

  button.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 600);
}
