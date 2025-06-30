import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthButton } from '@/components/auth-button';
import { useAuth } from '@/hooks/use-auth';
import '@testing-library/jest-dom';

// Mock the useAuth hook
jest.mock('@/hooks/use-auth');

// TypeScript casting for the mocked hook
const mockedUseAuth = useAuth as jest.Mock;

describe('AuthButton Component', () => {

  it('should render a skeleton when loading', () => {
    mockedUseAuth.mockReturnValue({
      loading: true,
      login: jest.fn(),
    });

    render(<AuthButton />);
    
    // The skeleton component doesn't have text, so we'll look for its base element.
    // ShadCN Skeleton renders a div with a specific class.
    const skeletonElement = document.querySelector('.animate-pulse');
    expect(skeletonElement).toBeInTheDocument();
    
    // Check that the button is not rendered
    const buttonElement = screen.queryByRole('button');
    expect(buttonElement).not.toBeInTheDocument();
  });

  it('should render the login button when not loading', () => {
    mockedUseAuth.mockReturnValue({
      loading: false,
      login: jest.fn(),
    });

    render(<AuthButton />);
    
    const buttonElement = screen.getByRole('button', { name: /Continue with Google/i });
    expect(buttonElement).toBeInTheDocument();
    
    // Check that the skeleton is not rendered
    const skeletonElement = document.querySelector('.animate-pulse');
    expect(skeletonElement).not.toBeInTheDocument();
  });

  it('should call the login function on button click', () => {
    const mockLogin = jest.fn();
    mockedUseAuth.mockReturnValue({
      loading: false,
      login: mockLogin,
    });

    render(<AuthButton />);
    
    const buttonElement = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(buttonElement);
    
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});
