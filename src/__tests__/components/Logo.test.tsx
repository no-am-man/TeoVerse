import React from 'react';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/logo';
import '@testing-library/jest-dom';

describe('Logo Component', () => {
  it('should render the app name "TeoVerse"', () => {
    render(<Logo />);
    const appNameElement = screen.getByText('TeoVerse');
    expect(appNameElement).toBeInTheDocument();
  });

  it('should render the SVG logo icon', () => {
    render(<Logo />);
    // A good way to find the SVG is by its role or structure if accessible names aren't present
    // For this SVG, we can check its presence by looking for a 'svg' tag.
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass('text-primary');
  });

  it('should apply additional className when provided', () => {
    const testClass = 'my-custom-class';
    render(<Logo className={testClass} />);
    const logoContainer = screen.getByText('TeoVerse').parentElement;
    expect(logoContainer).toHaveClass(testClass);
  });
});
