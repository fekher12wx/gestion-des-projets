import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import searchService from '../services/search.service';
import type { SearchResults } from '../types';
import './GlobalSearch.css';

const GlobalSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const debounceRef = useRef<NodeJS.Timeout>();

    // Flatten results for keyboard navigation
    const flatResults = results
        ? [
            ...results.poiFiles.map((r) => ({ ...r, _type: 'poiFile' as const, _label: r.fileNumber, _sub: `${r.project || ''} · ${r.status}` })),
            ...results.projects.map((r) => ({ ...r, _type: 'project' as const, _label: r.name, _sub: `${r.code} · ${r.client || ''}` })),
            ...results.clients.map((r) => ({ ...r, _type: 'client' as const, _label: r.name, _sub: r.code })),
            ...results.regions.map((r) => ({ ...r, _type: 'region' as const, _label: r.name, _sub: r.code })),
            ...results.users.map((r) => ({ ...r, _type: 'user' as const, _label: `${r.firstName} ${r.lastName}`, _sub: `${r.email} · ${r.role || ''}` })),
        ]
        : [];

    // Open/close with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await searchService.search(searchQuery);
            setResults(data);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => performSearch(value), 300);
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults(null);
        setSelectedIndex(0);
    };

    const navigateToResult = (item: (typeof flatResults)[number]) => {
        handleClose();
        switch (item._type) {
            case 'poiFile':
                navigate('/poi-files');
                break;
            case 'project':
                navigate('/projects');
                break;
            case 'client':
                navigate('/clients');
                break;
            case 'region':
                navigate('/regions');
                break;
            case 'user':
                navigate('/admin/users');
                break;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
            e.preventDefault();
            navigateToResult(flatResults[selectedIndex]);
        }
    };

    const getCategoryIcon = (type: string) => {
        switch (type) {
            case 'poiFile':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <path d="M14 2v6h6" />
                    </svg>
                );
            case 'project':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                    </svg>
                );
            case 'client':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                );
            case 'region':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                );
            case 'user':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getCategoryLabel = (type: string) => {
        switch (type) {
            case 'poiFile': return 'POI Files';
            case 'project': return 'Projects';
            case 'client': return 'Clients';
            case 'region': return 'Regions';
            case 'user': return 'Users';
            default: return '';
        }
    };

    if (!isOpen) {
        return (
            <button className="search-trigger" onClick={() => setIsOpen(true)} title="Search (Ctrl+K)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                <span className="search-trigger-text">Search...</span>
                <kbd className="search-trigger-kbd">Ctrl+K</kbd>
            </button>
        );
    }

    // Group results by type for rendering section headers
    const groupedTypes = ['poiFile', 'project', 'client', 'region', 'user'] as const;
    let globalIndex = 0;

    return (
        <div className="search-overlay" onClick={handleClose}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="search-input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search POI files, projects, clients, regions, users..."
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="search-escape-kbd" onClick={handleClose}>Esc</kbd>
                </div>

                <div className="search-results">
                    {loading && (
                        <div className="search-loading">
                            <div className="search-spinner" />
                            Searching...
                        </div>
                    )}

                    {!loading && query.length >= 2 && flatResults.length === 0 && (
                        <div className="search-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p>No results found for "<strong>{query}</strong>"</p>
                            <span>Try a different search term</span>
                        </div>
                    )}

                    {!loading && results && flatResults.length > 0 && (
                        <>
                            {groupedTypes.map((type) => {
                                const items = flatResults.filter((r) => r._type === type);
                                if (items.length === 0) return null;

                                return (
                                    <div key={type} className="search-category">
                                        <div className="search-category-header">
                                            {getCategoryIcon(type)}
                                            <span>{getCategoryLabel(type)}</span>
                                        </div>
                                        {items.map((item) => {
                                            const idx = globalIndex++;
                                            return (
                                                <button
                                                    key={item.id}
                                                    className={`search-result-item ${idx === selectedIndex ? 'selected' : ''}`}
                                                    onClick={() => navigateToResult(item)}
                                                    onMouseEnter={() => setSelectedIndex(idx)}
                                                >
                                                    <div className="search-result-content">
                                                        <span className="search-result-label">{item._label}</span>
                                                        <span className="search-result-sub">{item._sub}</span>
                                                    </div>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M9 18l6-6-6-6" />
                                                    </svg>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {!loading && query.length < 2 && (
                        <div className="search-hint">
                            <p>Type at least 2 characters to search</p>
                            <div className="search-hint-shortcuts">
                                <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                                <span><kbd>↵</kbd> to select</span>
                                <span><kbd>Esc</kbd> to close</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
