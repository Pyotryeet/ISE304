/**
 * THE HIVE - Frontend Component Tests
 * React Component Unit Tests
 * 
 * Test Specification Document Reference: Section 2.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock components for isolated testing
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import EventGrid from '../components/EventGrid';

// Wrapper for components that need Router
const RouterWrapper = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

/**
 * TEST SUITE: EventCard Component
 * White Box Testing - Component Rendering
 */
describe('EventCard Component Tests', () => {
    const mockEvent = {
        id: 1,
        title: 'Test Event Title',
        description: 'Test description',
        event_date: '2025-03-15T14:00:00',
        location: 'ITU Campus',
        category: 'technology',
        status: 'published',
        source: 'manual',
        club_name: 'Test Club'
    };

    // TC-FE-001: Renders event title
    it('TC-FE-001: Should render event title', () => {
        render(
            <RouterWrapper>
                <EventCard event={mockEvent} />
            </RouterWrapper>
        );

        expect(screen.getByText('Test Event Title')).toBeDefined();
    });

    // TC-FE-002: Renders event location
    it('TC-FE-002: Should render event location', () => {
        render(
            <RouterWrapper>
                <EventCard event={mockEvent} />
            </RouterWrapper>
        );

        expect(screen.getByText('ITU Campus')).toBeDefined();
    });

    // TC-FE-003: Renders club name
    it('TC-FE-003: Should render club name', () => {
        render(
            <RouterWrapper>
                <EventCard event={mockEvent} />
            </RouterWrapper>
        );

        expect(screen.getByText('Test Club')).toBeDefined();
    });

    // TC-FE-004: Displays correct source badge
    it('TC-FE-004: Should show correct source badge for manual events', () => {
        render(
            <RouterWrapper>
                <EventCard event={mockEvent} />
            </RouterWrapper>
        );

        expect(screen.getByText('✏️ Manual')).toBeDefined();
    });

    // TC-FE-005: Displays scraped badge for scraped events
    it('TC-FE-005: Should show correct source badge for scraped events', () => {
        const scrapedEvent = { ...mockEvent, source: 'scraped' };
        render(
            <RouterWrapper>
                <EventCard event line={scrapedEvent} />
            </RouterWrapper>
        );

        expect(screen.getByText('🤖 Auto')).toBeDefined();
    });

    // TC-FE-006: Card links to event detail page
    it('TC-FE-006: Should link to event detail page', () => {
        render(
            <RouterWrapper>
                <EventCard event={mockEvent} />
            </RouterWrapper>
        );

        const link = screen.getByRole('link');
        expect(link.getAttribute('href')).toBe('/events/1');
    });

    // TC-FE-007: Handles missing optional fields
    it('TC-FE-007: Should render without optional fields', () => {
        const minimalEvent = {
            id: 2,
            title: 'Minimal Event',
            event_date: '2025-03-15T14:00:00',
            status: 'published',
            source: 'manual'
        };

        render(
            <RouterWrapper>
                <EventCard event={minimalEvent} />
            </RouterWrapper>
        );

        expect(screen.getByText('Minimal Event')).toBeDefined();
    });
});

/**
 * TEST SUITE: SearchBar Component
 */
describe('SearchBar Component Tests', () => {

    // TC-FE-010: Renders search input
    it('TC-FE-010: Should render search input field', () => {
        const mockOnSearch = vi.fn();
        render(<SearchBar onSearch={mockOnSearch} />);

        expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
    });

    // TC-FE-011: Calls onSearch when typing
    it('TC-FE-011: Should call onSearch on input change', () => {
        const mockOnSearch = vi.fn();
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search/i);
        fireEvent.change(input, { target: { value: 'test' } });

        expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    // TC-FE-012: Handles empty search
    it('TC-FE-012: Should handle empty search input', () => {
        const mockOnSearch = vi.fn();
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText(/search/i);
        fireEvent.change(input, { target: { value: '' } });

        expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    // TC-FE-013: Renders search button
    it('TC-FE-013: Should render search button', () => {
        const mockOnSearch = vi.fn();
        render(<SearchBar onSearch={mockOnSearch} />);

        expect(screen.getByRole('button', { name: /search/i })).toBeDefined();
    });
});

/**
 * TEST SUITE: FilterBar Component
 */
describe('FilterBar Component Tests', () => {

    // TC-FE-020: Renders category buttons
    it('TC-FE-020: Should render filter buttons', () => {
        const mockOnChange = vi.fn();
        render(
            <FilterBar
                categories={[]}
                selectedCategory=""
                onCategoryChange={mockOnChange}
            />
        );

        expect(screen.getByText('All Events')).toBeDefined();
    });

    // TC-FE-021: Highlights selected category
    it('TC-FE-021: Should highlight active category', () => {
        const mockOnChange = vi.fn();
        render(
            <FilterBar
                categories={['music']}
                selectedCategory="music"
                onCategoryChange={mockOnChange}
            />
        );

        const musicButton = screen.getByText('music');
        expect(musicButton.closest('button').classList.contains('active')).toBe(true);
    });

    // TC-FE-022: Calls onCategoryChange when clicked
    it('TC-FE-022: Should call onCategoryChange on button click', () => {
        const mockOnChange = vi.fn();
        render(
            <FilterBar
                categories={[]}
                selectedCategory=""
                onCategoryChange={mockOnChange}
            />
        );

        const allButton = screen.getByText('All Events');
        fireEvent.click(allButton);

        expect(mockOnChange).toHaveBeenCalled();
    });
});

/**
 * TEST SUITE: EventGrid Component
 */
describe('EventGrid Component Tests', () => {
    const mockEvents = [
        { id: 1, title: 'Event 1', event_date: '2025-03-15T14:00:00', status: 'published', source: 'manual' },
        { id: 2, title: 'Event 2', event_date: '2025-03-16T14:00:00', status: 'published', source: 'scraped' }
    ];

    // TC-FE-030: Shows loading state
    it('TC-FE-030: Should show loading skeletons', () => {
        render(
            <RouterWrapper>
                <EventGrid events={[]} loading={true} error={null} />
            </RouterWrapper>
        );

        const skeletons = document.querySelectorAll('.skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    // TC-FE-031: Shows error state
    it('TC-FE-031: Should show error message', () => {
        render(
            <RouterWrapper>
                <EventGrid events={[]} loading={false} error="Network error" />
            </RouterWrapper>
        );

        expect(screen.getByText('Something went wrong')).toBeDefined();
    });

    // TC-FE-032: Shows empty state
    it('TC-FE-032: Should show empty state when no events', () => {
        render(
            <RouterWrapper>
                <EventGrid events={[]} loading={false} error={null} />
            </RouterWrapper>
        );

        expect(screen.getByText('No events found')).toBeDefined();
    });

    // TC-FE-033: Renders event cards
    it('TC-FE-033: Should render event cards', () => {
        render(
            <RouterWrapper>
                <EventGrid events={mockEvents} loading={false} error={null} />
            </RouterWrapper>
        );

        expect(screen.getByText('Event 1')).toBeDefined();
        expect(screen.getByText('Event 2')).toBeDefined();
    });
});

/**
 * FRONTEND TEST COVERAGE SUMMARY
 * 
 * EventCard: 7 tests
 * SearchBar: 4 tests
 * FilterBar: 3 tests
 * EventGrid: 4 tests
 * 
 * Total: 18 frontend component tests
 */
