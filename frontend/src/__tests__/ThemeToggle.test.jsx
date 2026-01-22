/**
 * ThemeToggle Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../components/ui/ThemeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';

describe('ThemeToggle Component', () => {
  it('should render theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button', { name: /theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('should toggle theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    
    // Initial state
    const initialLabel = button.getAttribute('aria-label');
    
    // Click to toggle
    fireEvent.click(button);
    
    // Should change label (indicating theme changed)
    const newLabel = button.getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });
});
