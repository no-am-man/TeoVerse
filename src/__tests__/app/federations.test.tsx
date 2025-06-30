import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FederationsPage from '@/app/(app)/federations/page';
import * as federationService from '@/services/federation-link-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import '@testing-library/jest-dom';

// Mock services and hooks
jest.mock('@/services/federation-link-service');
jest.mock('@/hooks/use-auth');
jest.mock('@/hooks/use-toast');

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseToast = useToast as jest.Mock;
const mockedGetLinkedFederations = federationService.getLinkedFederations as jest.Mock;
const mockedLinkFederation = federationService.linkFederation as jest.Mock;
const mockedUnlinkFederation = federationService.unlinkFederation as jest.Mock;

const mockUser = { uid: 'test-user-id' };
const mockToast = jest.fn();

describe('FederationsPage', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Mock the return values for hooks
        mockedUseAuth.mockReturnValue({ user: mockUser });
        mockedUseToast.mockReturnValue({ toast: mockToast });
    });

    it('should render the page title and form', async () => {
        mockedGetLinkedFederations.mockResolvedValue([]);
        render(<FederationsPage />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Linked Federations/i })).toBeInTheDocument();
        });

        expect(screen.getByLabelText(/Federation URL/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Link Federation/i })).toBeInTheDocument();
    });

    it('should display linked federations from the service', async () => {
        const mockFederations = [
            { id: '1', name: 'Alpha Centauri', url: 'http://alpha.fed', version: '1.0.0' },
            { id: '2', name: 'Proxima Centauri', url: 'http://proxima.fed', version: '1.1.0' },
        ];
        mockedGetLinkedFederations.mockResolvedValue(mockFederations);
        
        render(<FederationsPage />);

        // Wait for the federations to be displayed
        expect(await screen.findByText('Alpha Centauri')).toBeInTheDocument();
        expect(screen.getByText('Proxima Centauri')).toBeInTheDocument();
        expect(screen.getByText('http://alpha.fed')).toBeInTheDocument();
        expect(screen.getByText('v1.1.0')).toBeInTheDocument();
    });

    it('should allow linking a new federation and show it in the list', async () => {
        mockedGetLinkedFederations.mockResolvedValue([]);
        const newFederation = { id: '3', name: 'New Federation', url: 'http://new.fed', version: '1.0.0', linkedAt: Date.now() };
        mockedLinkFederation.mockResolvedValue(newFederation);

        const user = userEvent.setup();
        render(<FederationsPage />);
        
        // Wait for initial render
        await waitFor(() => expect(screen.getByRole('heading', { name: /Linked Federations/i })).toBeInTheDocument());

        const urlInput = screen.getByLabelText(/Federation URL/i);
        const linkButton = screen.getByRole('button', { name: /Link Federation/i });

        await user.type(urlInput, 'http://new.fed');
        await user.click(linkButton);

        // Check if the linkFederation service was called
        await waitFor(() => {
            expect(mockedLinkFederation).toHaveBeenCalledWith(mockUser.uid, 'http://new.fed');
        });

        // Check for success toast
        expect(mockToast).toHaveBeenCalledWith({
            title: "Success",
            description: `Successfully linked to ${newFederation.name}.`
        });

        // The component logic adds the new federation to the state, so it should appear
        expect(await screen.findByText('New Federation')).toBeInTheDocument();
        expect(screen.getByText('http://new.fed')).toBeInTheDocument();
    });

    it('should show an error toast if linking fails', async () => {
        mockedGetLinkedFederations.mockResolvedValue([]);
        const errorMessage = 'Version mismatch.';
        mockedLinkFederation.mockRejectedValue(new Error(errorMessage));

        const user = userEvent.setup();
        render(<FederationsPage />);

        await waitFor(() => expect(screen.getByRole('heading', { name: /Linked Federations/i })).toBeInTheDocument());

        const urlInput = screen.getByLabelText(/Federation URL/i);
        const linkButton = screen.getByRole('button', { name: /Link Federation/i });

        await user.type(urlInput, 'http://invalid.fed');
        await user.click(linkButton);

        await waitFor(() => {
            expect(mockedLinkFederation).toHaveBeenCalled();
        });

        expect(mockToast).toHaveBeenCalledWith({
            title: "Linking Failed",
            description: errorMessage,
            variant: "destructive"
        });
    });

    it('should allow unlinking a federation', async () => {
        const mockFederations = [
            { id: '1', name: 'Alpha Centauri', url: 'http://alpha.fed', version: '1.0.0' },
        ];
        mockedGetLinkedFederations.mockResolvedValue(mockFederations);
        mockedUnlinkFederation.mockResolvedValue(undefined);

        const user = userEvent.setup();
        render(<FederationsPage />);

        const federationName = await screen.findByText('Alpha Centauri');
        const row = federationName.closest('tr');
        if (!row) throw new Error("Could not find table row");

        const unlinkButton = screen.getByRole('button', { name: /Unlink/i });
        await user.click(unlinkButton);

        // Confirmation dialog appears
        const confirmButton = await screen.findByRole('button', { name: 'Unlink' }); // The action button in the dialog
        await user.click(confirmButton);

        await waitFor(() => {
            expect(mockedUnlinkFederation).toHaveBeenCalledWith(mockUser.uid, '1');
        });

        expect(mockToast).toHaveBeenCalledWith({
            title: "Success",
            description: "Federation has been unlinked."
        });

        // The item should be removed from the list
        await waitFor(() => {
            expect(screen.queryByText('Alpha Centauri')).not.toBeInTheDocument();
        });
    });
});
