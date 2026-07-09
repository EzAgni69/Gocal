import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from './AuthModal';
import { useAppContext } from '../context/AppContext';

// Mock useAppContext
jest.mock('../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock firebase auth config
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AuthModal — Phone Sign In / Up & First-Time Name Onboarding', () => {
  let mockSendPhoneOTP: jest.Mock;
  let mockConfirmPhoneOTP: jest.Mock;
  let mockUpdateUserName: jest.Mock;
  let mockSetShowAuthModal: jest.Mock;
  let mockSetAuthModalMode: jest.Mock;

  beforeEach(() => {
    mockSendPhoneOTP = jest.fn();
    mockConfirmPhoneOTP = jest.fn();
    mockUpdateUserName = jest.fn();
    mockSetShowAuthModal = jest.fn();
    mockSetAuthModalMode = jest.fn();

    // Mock window.recaptchaVerifier
    (window as any).recaptchaVerifier = {
      render: jest.fn().mockResolvedValue(1),
    };

    (useAppContext as jest.Mock).mockReturnValue({
      showAuthModal: true,
      setShowAuthModal: mockSetShowAuthModal,
      authModalMode: 'phone',
      setAuthModalMode: mockSetAuthModalMode,
      sendPhoneOTP: mockSendPhoneOTP,
      confirmPhoneOTP: mockConfirmPhoneOTP,
      updateUserName: mockUpdateUserName,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Phone Sign In / Up title along with optional Name input and Phone input', () => {
    render(<AuthModal />);

    expect(screen.getByRole('heading', { name: 'Phone Sign In / Up' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name (Optional for returning users)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone Number (e.g., +91...)')).toBeInTheDocument();
  });

  it('passes user name along with OTP when user enters Name on initial phone step', async () => {
    const mockConfirmationResult = { confirm: jest.fn() };
    mockSendPhoneOTP.mockResolvedValueOnce(mockConfirmationResult);
    mockConfirmPhoneOTP.mockResolvedValueOnce(true);

    render(<AuthModal />);

    // 1. Enter Name + Phone and submit
    fireEvent.change(screen.getByPlaceholderText('Full Name (Optional for returning users)'), {
      target: { value: 'Priya Sharma' },
    });
    fireEvent.change(screen.getByPlaceholderText('Phone Number (e.g., +91...)'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

    // 2. Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument();
    });

    // 3. Enter OTP and verify
    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(mockConfirmPhoneOTP).toHaveBeenCalledWith(
        mockConfirmationResult,
        '123456',
        'Priya Sharma'
      );
    });
  });

  it('prompts first-time phone user for Name if no display name exists after OTP confirmation', async () => {
    const mockConfirmationResult = { confirm: jest.fn() };
    mockSendPhoneOTP.mockResolvedValueOnce(mockConfirmationResult);
    mockConfirmPhoneOTP.mockResolvedValueOnce(true);

    render(<AuthModal />);

    // 1. Enter Phone ONLY (leave Name empty)
    fireEvent.change(screen.getByPlaceholderText('Phone Number (e.g., +91...)'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument();
    });

    // 2. Enter OTP and submit
    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify OTP/i }));

    // 3. Expect transition to First-Time Name onboarding prompt
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome to Gocal!' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    });

    // 4. Enter Name and save
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'Aditya Patel' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }));

    await waitFor(() => {
      expect(mockUpdateUserName).toHaveBeenCalledWith('Aditya Patel');
      expect(mockSetShowAuthModal).toHaveBeenCalledWith(false);
    });
  });

  it('displays user-friendly error message when OTP verification fails', async () => {
    const mockConfirmationResult = { confirm: jest.fn() };
    mockSendPhoneOTP.mockResolvedValueOnce(mockConfirmationResult);

    const firebaseError = Object.assign(new Error('Firebase Error'), {
      code: 'auth/invalid-verification-code',
    });
    mockConfirmPhoneOTP.mockRejectedValueOnce(firebaseError);

    render(<AuthModal />);

    fireEvent.change(screen.getByPlaceholderText('Phone Number (e.g., +91...)'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), {
      target: { value: '000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(
        screen.getByText('The OTP you entered is incorrect. Please check and try again.')
      ).toBeInTheDocument();
    });
  });
});
