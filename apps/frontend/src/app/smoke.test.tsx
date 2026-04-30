import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Frontend Smoke Test', () => {
  it('renders a basic element', () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});
