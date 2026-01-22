/**
 * Tests for BTLSliderControls component
 * Tests slider interactions for rolled months and deferred interest
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BTLSliderControls from '../../components/BTLSliderControls';

describe('BTLSliderControls', () => {
  const defaultProps = {
    columnKey: 'Fee: 2%',
    rolledMonths: null,
    deferredInterest: null,
    optimizedRolled: 12,
    optimizedDeferred: 50,
    isManualMode: false,
    onRolledChange: vi.fn(),
    onDeferredChange: vi.fn(),
    onReset: vi.fn()
  };

  describe('Rendering', () => {
    it('should render both sliders', () => {
      render(<BTLSliderControls {...defaultProps} />);

      expect(screen.getByLabelText(/rolled months/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deferred interest/i)).toBeInTheDocument();
    });

    it('should display optimized values when no manual values set', () => {
      render(<BTLSliderControls {...defaultProps} />);

      expect(screen.getByText(/\(12 months\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(50%\)/i)).toBeInTheDocument();
    });

    it('should display manual values when set', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          rolledMonths={15}
          deferredInterest={75}
        />
      );

      expect(screen.getByText(/\(15 months\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(75%\)/i)).toBeInTheDocument();
    });

    it('should show reset button when in manual mode', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={true}
        />
      );

      expect(screen.getByText(/reset to optimized/i)).toBeInTheDocument();
    });

    it('should not show reset button when not in manual mode', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={false}
        />
      );

      expect(screen.queryByText(/reset to optimized/i)).not.toBeInTheDocument();
    });

    it('should show manual mode badge when active', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={true}
        />
      );

      expect(screen.getByText(/manual mode/i)).toBeInTheDocument();
    });

    it('should not show manual mode badge when inactive', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={false}
        />
      );

      expect(screen.queryByText(/manual mode/i)).not.toBeInTheDocument();
    });
  });

  describe('Rolled Months Slider', () => {
    it('should have correct default range (0-18)', () => {
      render(<BTLSliderControls {...defaultProps} />);

      const slider = screen.getByLabelText(/rolled months/i);
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '18');
      expect(slider).toHaveAttribute('step', '1');
    });

    it('should call onRolledChange when slider moves', () => {
      const onRolledChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onRolledChange={onRolledChange}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      fireEvent.change(slider, { target: { value: '10' } });

      expect(onRolledChange).toHaveBeenCalledWith('Fee: 2%', 10);
    });

    it('should display current rolled months value', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          rolledMonths={14}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      expect(slider).toHaveValue('14');
    });

    it('should allow zero rolled months', () => {
      const onRolledChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onRolledChange={onRolledChange}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      fireEvent.change(slider, { target: { value: '0' } });

      expect(onRolledChange).toHaveBeenCalledWith('Fee: 2%', 0);
    });

    it('should allow maximum rolled months', () => {
      const onRolledChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onRolledChange={onRolledChange}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      fireEvent.change(slider, { target: { value: '18' } });

      expect(onRolledChange).toHaveBeenCalledWith('Fee: 2%', 18);
    });

    it('should use custom max if provided', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          maxRolledMonths={24}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      expect(slider).toHaveAttribute('max', '24');
    });
  });

  describe('Deferred Interest Slider', () => {
    it('should have correct default range (0-100)', () => {
      render(<BTLSliderControls {...defaultProps} />);

      const slider = screen.getByLabelText(/deferred interest/i);
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveAttribute('step', '1');
    });

    it('should call onDeferredChange when slider moves', () => {
      const onDeferredChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onDeferredChange={onDeferredChange}
        />
      );

      const slider = screen.getByLabelText(/deferred interest/i);
      fireEvent.change(slider, { target: { value: '60' } });

      expect(onDeferredChange).toHaveBeenCalledWith('Fee: 2%', 60);
    });

    it('should display current deferred interest value', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          deferredInterest={80}
        />
      );

      const slider = screen.getByLabelText(/deferred interest/i);
      expect(slider).toHaveValue('80');
    });

    it('should allow zero deferred interest', () => {
      const onDeferredChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onDeferredChange={onDeferredChange}
        />
      );

      const slider = screen.getByLabelText(/deferred interest/i);
      fireEvent.change(slider, { target: { value: '0' } });

      expect(onDeferredChange).toHaveBeenCalledWith('Fee: 2%', 0);
    });

    it('should allow maximum deferred interest', () => {
      const onDeferredChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onDeferredChange={onDeferredChange}
        />
      );

      const slider = screen.getByLabelText(/deferred interest/i);
      fireEvent.change(slider, { target: { value: '100' } });

      expect(onDeferredChange).toHaveBeenCalledWith('Fee: 2%', 100);
    });

    it('should use custom max if provided', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          maxDeferredPercent={75}
        />
      );

      const slider = screen.getByLabelText(/deferred interest/i);
      expect(slider).toHaveAttribute('max', '75');
    });
  });

  describe('Reset Functionality', () => {
    it('should call onReset when reset button clicked', () => {
      const onReset = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={true}
          onReset={onReset}
        />
      );

      const resetButton = screen.getByText(/reset to optimized/i);
      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledWith('Fee: 2%');
    });

    it('should not show reset button in read-only mode', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={true}
          isReadOnly={true}
        />
      );

      expect(screen.queryByText(/reset to optimized/i)).not.toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={true}
        />
      );

      const resetButton = screen.getByText(/reset to optimized/i);
      expect(resetButton).toHaveClass('slds-button');
    });
  });

  describe('Read-only Mode', () => {
    it('should disable rolled months slider when read-only', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isReadOnly={true}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      expect(slider).toBeDisabled();
    });

    it('should disable deferred interest slider when read-only', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isReadOnly={true}
        />
      );

      const slider = screen.getByLabelText(/deferred interest/i);
      expect(slider).toBeDisabled();
    });

    it('should not call callbacks when disabled', () => {
      const onRolledChange = vi.fn();
      const onDeferredChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          isReadOnly={true}
          onRolledChange={onRolledChange}
          onDeferredChange={onDeferredChange}
        />
      );

      const rolledSlider = screen.getByLabelText(/rolled months/i);
      const deferredSlider = screen.getByLabelText(/deferred interest/i);

      fireEvent.change(rolledSlider, { target: { value: '10' } });
      fireEvent.change(deferredSlider, { target: { value: '60' } });

      expect(onRolledChange).not.toHaveBeenCalled();
      expect(onDeferredChange).not.toHaveBeenCalled();
    });
  });

  describe('Value Display Priority', () => {
    it('should prefer manual values over optimized', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          rolledMonths={10}
          deferredInterest={60}
          optimizedRolled={12}
          optimizedDeferred={50}
        />
      );

      expect(screen.getByText(/\(10 months\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(60%\)/i)).toBeInTheDocument();
    });

    it('should use optimized when manual is null', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          rolledMonths={null}
          deferredInterest={null}
          optimizedRolled={15}
          optimizedDeferred={75}
        />
      );

      expect(screen.getByText(/\(15 months\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(75%\)/i)).toBeInTheDocument();
    });

    it('should display zero values correctly', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          rolledMonths={0}
          deferredInterest={0}
        />
      );

      expect(screen.getByText(/\(0 months\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(0%\)/i)).toBeInTheDocument();
    });

    it('should default to zero when all values are null', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          rolledMonths={null}
          deferredInterest={null}
          optimizedRolled={null}
          optimizedDeferred={null}
        />
      );

      expect(screen.getByText(/\(0 months\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(0%\)/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined columnKey', () => {
      const onRolledChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          columnKey={undefined}
          onRolledChange={onRolledChange}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      fireEvent.change(slider, { target: { value: '10' } });

      expect(onRolledChange).toHaveBeenCalledWith(undefined, 10);
    });

    it('should handle null callbacks gracefully', () => {
      expect(() => {
        render(
          <BTLSliderControls
            {...defaultProps}
            onRolledChange={null}
            onDeferredChange={null}
            onReset={null}
          />
        );
      }).not.toThrow();
    });

    it('should handle negative values by converting to number', () => {
      const onRolledChange = vi.fn();
      render(
        <BTLSliderControls
          {...defaultProps}
          onRolledChange={onRolledChange}
        />
      );

      const slider = screen.getByLabelText(/rolled months/i);
      // Sliders typically don't allow negative - component clamps to 0
      fireEvent.change(slider, { target: { value: '-5' } });

      expect(onRolledChange).toHaveBeenCalledWith('Fee: 2%', 0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(<BTLSliderControls {...defaultProps} />);

      const rolledSlider = screen.getByLabelText(/rolled months/i);
      const deferredSlider = screen.getByLabelText(/deferred interest/i);

      expect(rolledSlider).toHaveAttribute('id');
      expect(deferredSlider).toHaveAttribute('id');
    });

    it('should be keyboard accessible', () => {
      render(<BTLSliderControls {...defaultProps} />);

      const slider = screen.getByLabelText(/rolled months/i);
      slider.focus();
      expect(document.activeElement).toBe(slider);
    });

    it('should have range role for sliders', () => {
      render(<BTLSliderControls {...defaultProps} />);

      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
    });
  });

  describe('Visual Feedback', () => {
    it('should apply warning theme to manual mode badge', () => {
      render(
        <BTLSliderControls
          {...defaultProps}
          isManualMode={true}
        />
      );

      const badge = screen.getByText(/manual mode/i);
      expect(badge).toHaveClass('slds-theme_warning');
    });

    it('should show consistent styling across re-renders', () => {
      const { rerender } = render(
        <BTLSliderControls {...defaultProps} />
      );

      const slider1 = screen.getByLabelText(/rolled months/i);
      const classes1 = slider1.className;

      rerender(<BTLSliderControls {...defaultProps} />);

      const slider2 = screen.getByLabelText(/rolled months/i);
      const classes2 = slider2.className;

      expect(classes1).toBe(classes2);
    });
  });
});
