import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { DemoDataBanner } from './DemoDataBanner';
import { markMockDataServed, resetDemoMode } from '../../api/demoMode';

describe('DemoDataBanner', () => {
  beforeEach(() => {
    resetDemoMode();
  });

  it('renders nothing while the backend answers normally', () => {
    const { container } = render(<DemoDataBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the sample-data label once the offline fallback fires', () => {
    render(<DemoDataBanner />);
    act(() => markMockDataServed('/events'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Sample data mode/)).toBeInTheDocument();
    expect(screen.getByText(/not live records/)).toBeInTheDocument();
  });

  it('hides again when demo mode is reset', () => {
    render(<DemoDataBanner />);
    act(() => markMockDataServed('/events'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    act(() => resetDemoMode());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
