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
  auth: {},
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AuthModal — Phone Sign In / Up Testing', () => {
  let mockSendPhoneOTP: jest.Mock;
  let mockConfirmPhoneOTP: jest.Mock;
  let mockSetShowAuthModal: jest.Mock;
  let mockSetAuthModalMode: jest.Mock;

  beforeEach(() => {
    mockSendPhoneOTP = jest.fn();
    mockConfirmPhoneOTP = jest.fn();
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
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      register: jest.fn(),
      resetPassword: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Phone Sign In / Up title and subtitle correctly', () => {
    render(<AuthModal />);

    expect(screen.getByRole('heading', { name: 'Phone Sign In / Up' })).toBeInTheDocument();
    expect(
      screen.getByText('Sign in or register with your phone number')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone Number (e.g., +91...)')).toBeInTheDocument();
  });

  it('formats phone number with +91 country code and calls sendPhoneOTP when "Send OTP" is clicked', async () => {
    const mockConfirmationResult = { confirm: jest.fn() };
    mockSendPhoneOTP.mockResolvedValueOnce(mockConfirmationResult);

    render(<AuthModal />);

    const phoneInput = screen.getByPlaceholderText('Phone Number (e.g., +91...)');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const sendOtpButton = screen.getByRole('button', { name: /Send OTP/i });
    fireEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(mockSendPhoneOTP).toHaveBeenCalledWith('+919876543210', expect.anything());
    });
  });

  it('shows OTP input after sendPhoneOTP succeeds and verifies OTP on submission', async () => {
    const mockConfirmationResult = { confirm: jest.fn() };
    mockSendPhoneOTP.mockResolvedValueOnce(mockConfirmationResult);
    mockConfirmPhoneOTP.mockResolvedValueOnce(true);

    render(<AuthModal />);

    // 1. Enter phone number and submit
    const phoneInput = screen.getByPlaceholderText('Phone Number (e.g., +91...)');
    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });

    fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

    // 2. Wait for OTP input screen to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument();
    });

    expect(screen.getByText('Enter the OTP sent to your phone')).toBeInTheDocument();

    // 3. Enter OTP code
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP');
    fireEvent.change(otpInput, { target: { value: '123456' } });

    // 4. Click Verify OTP
    const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(mockConfirmPhoneOTP).toHaveBeenCalledWith(mockConfirmationResult, '123456');
    });
  });

  it('displays user-friendly error message when OTP verification fails with auth/invalid-verification-code', async () => {
    const mockConfirmationResult = { confirm: jest.fn() };
    mockSendPhoneOTP.mockResolvedValueOnce(mockConfirmationResult);

    const firebaseError = Object.assign(new Error('Firebase Error'), {
      code: 'auth/invalid-verification-code',
    });
    mockConfirmPhoneOTP.mockRejectedValueOnce(firebaseError);

    render(<AuthModal />);

    // 1. Send OTP
    fireEvent.change(screen.getByPlaceholderText('Phone Number (e.g., +91...)'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument();
    });

    // 2. Enter incorrect OTP
    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit OTP'), {
      target: { value: '000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify OTP/i }));

    // 3. Verify user-facing error message appears
    await waitFor(() => {
      expect(
        screen.getByText('The OTP you entered is incorrect. Please check and try again.')
      ).toBeInTheDocument();
    });
  });

  it('allows user to click back/change phone number from OTP screen', async () => {
    mockSendPhoneOTP.mockResolvedValueOnce({ confirm: jest.fn() });

    render(<AuthModal />);

    fireEvent.change(screen.getByPlaceholderText('Phone Number (e.g., +91...)'), {
      target: { value: '+919876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send OTP/i }));

    await waitFor(() => {
      expect(screen.getByText('← Change phone number')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('← Change phone number'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Phone Number (e.g., +91...)')).toBeInTheDocument();
    });
  });
});
