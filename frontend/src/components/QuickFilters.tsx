import React, { useState, useEffect } from 'react';
import savedFilterService from '../services/saved-filter.service';
import type { SavedFilter } from '../types';
import './QuickFilters.css';

interface QuickFiltersProps {
    entity: string;
    currentFilters: Record<string, any>;
    onFilterChange: (filters: Record<string, any>) => void;
    filterOptions: Array<{
        key: string;
        label: string;
        values: Array<{ value: string; label: string }>;
    }>;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
    entity,
    currentFilters,
    onFilterChange,
    filterOptions,
}) => {
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [showSavedDropdown, setShowSavedDropdown] = useState(false);

    useEffect(() => {
        loadSavedFilters();
    }, [entity]);

    const loadSavedFilters = async () => {
        try {
            const filters = await savedFilterService.getFilters(entity);
            setSavedFilters(filters);
        } catch (error) {
            console.error('Failed to load saved filters:', error);
        }
    };

    const handleChipClick = (key: string, value: string) => {
        const newFilters = { ...currentFilters };
        if (newFilters[key] === value) {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        onFilterChange(newFilters);
    };

    const handleSaveFilter = async () => {
        if (!filterName.trim()) return;

        try {
            await savedFilterService.createFilter({
                name: filterName.trim(),
                entity,
                filters: currentFilters,
            });
            setFilterName('');
            setShowSaveModal(false);
            await loadSavedFilters();
        } catch (error) {
            console.error('Failed to save filter:', error);
        }
    };

    const handleLoadFilter = (filter: SavedFilter) => {
        onFilterChange(filter.filters);
        setShowSavedDropdown(false);
    };

    const handleDeleteFilter = async (e: React.MouseEvent, filterId: string) => {
        e.stopPropagation();
        try {
            await savedFilterService.deleteFilter(filterId);
            await loadSavedFilters();
        } catch (error) {
            console.error('Failed to delete filter:', error);
        }
    };

    const handleClearAll = () => {
        onFilterChange({});
    };

    const hasActiveFilters = Object.keys(currentFilters).length > 0;

    return (
        <div className="quick-filters">
            <div className="quick-filters-row">
                <div className="quick-filters-chips">
                    {filterOptions.map((option) => (
                        <div key={option.key} className="filter-group">
                            <span className="filter-group-label">{option.label}:</span>
                            {option.values.map((val) => (
                                <button
                                    key={val.value}
                                    className={`filter-chip ${currentFilters[option.key] === val.value ? 'active' : ''}`}
                                    onClick={() => handleChipClick(option.key, val.value)}
                                >
                                    {val.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="quick-filters-actions">
                    {hasActiveFilters && (
                        <>
                            <button className="qf-btn qf-btn-clear" onClick={handleClearAll}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                                Clear
                            </button>
                            <button className="qf-btn qf-btn-save" onClick={() => setShowSaveModal(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                    <path d="M17 21v-8H7v8M7 3v5h8" />
                                </svg>
                                Save
                            </button>
                        </>
                    )}

                    {savedFilters.length > 0 && (
                        <div className="saved-filters-dropdown-wrapper">
                            <button
                                className="qf-btn qf-btn-saved"
                                onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                </svg>
                                Saved ({savedFilters.length})
                            </button>
                            {showSavedDropdown && (
                                <div className="saved-filters-dropdown">
                                    {savedFilters.map((filter) => (
                                        <div
                                            key={filter.id}
                                            className="saved-filter-item"
                                            onClick={() => handleLoadFilter(filter)}
                                        >
                                            <span className="saved-filter-name">
                                                {filter.isDefault && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                )}
                                                {filter.name}
                                            </span>
                                            <button
                                                className="saved-filter-delete"
                                                onClick={(e) => handleDeleteFilter(e, filter.id)}
                                                title="Delete filter"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Save Filter Modal */}
            {showSaveModal && (
                <div className="save-filter-modal-overlay" onClick={() => setShowSaveModal(false)}>
                    <div className="save-filter-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Save Current Filters</h4>
                        <input
                            type="text"
                            placeholder="Filter name..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                            autoFocus
                        />
                        <div className="save-filter-actions">
                            <button className="qf-btn qf-btn-clear" onClick={() => setShowSaveModal(false)}>Cancel</button>
                            <button className="qf-btn qf-btn-save" onClick={handleSaveFilter} disabled={!filterName.trim()}>Save Filter</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickFilters;
