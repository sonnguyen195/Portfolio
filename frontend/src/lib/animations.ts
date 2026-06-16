import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Magnetic button interaction
 */
export const createMagneticEffect = (element: HTMLElement | null, strength = 40) => {
  if (!element) return;

  const move = (e: MouseEvent) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const x = e.clientX - (left + width / 2);
    const y = e.clientY - (top + height / 2);

    gsap.to(element, {
      x: (x / width) * strength,
      y: (y / height) * strength,
      duration: 1,
      ease: 'power3.out',
    });
  };

  const reset = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 1.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  element.addEventListener('mousemove', move);
  element.addEventListener('mouseleave', reset);

  return () => {
    element.removeEventListener('mousemove', move);
    element.removeEventListener('mouseleave', reset);
  };
};

/**
 * Scroll reveal animation for sections/cards
 */
export const revealOnScroll = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;

  gsap.fromTo(
    element,
    {
      y: 60,
      opacity: 0,
      filter: 'blur(10px)',
    },
    {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 1.2,
      delay,
      ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    }
  );
};

/**
 * Staggered reveal for lists
 */
export const staggerReveal = (elements: HTMLElement[], delay = 0) => {
  if (elements.length === 0) return;

  gsap.fromTo(
    elements,
    {
      y: 40,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.1,
      delay,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: elements[0],
        start: 'top 90%',
      },
    }
  );
};
