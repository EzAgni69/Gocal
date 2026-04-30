import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext } from './AppContext';
import { onAuthStateChanged } from 'firebase/auth';
import { apiClient } from '../services/apiClient';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  auth: {},
}));

// Mock apiClient
jest.mock('../services/apiClient', () => ({
  apiClient: jest.fn(),
}));

const TestComponent = () => {
  const { language, setLanguage, isAuthenticated, requireAuth } = useAppContext();
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="auth">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <button onClick={() => setLanguage('hi')}>Change Language</button>
      <button onClick={() => requireAuth('test action')}>Require Auth</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for onAuthStateChanged
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null); // Not authenticated by default
      return jest.fn(); // Unsubscribe
    });
  });

  it('provides default state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('auth')).toHaveTextContent('not-authenticated');
  });

  it('updates language state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Change Language').click();
    });

    expect(screen.getByTestId('language')).toHaveTextContent('hi');
  });

  it('handles authentication state changes', async () => {
    let authCallback: any;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn();
    });

    (apiClient as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '123', role: 'CONSUMER' } }),
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Simulate login
    await act(async () => {
      await authCallback({
        uid: '123',
        email: 'test@test.com',
        getIdToken: async () => 'mock-token',
      });
    });

    expect(screen.getByTestId('auth')).toHaveTextContent('authenticated');
  });
});
