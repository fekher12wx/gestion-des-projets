import React from 'react';
import type { FileHistory } from '../services/file-history.service';
import './ActivityTimeline.css';

interface ActivityTimelineProps {
    history: FileHistory[];
    loading?: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ history, loading }) => {
    const getActionIcon = (action: string): string => {
        switch (action.toUpperCase()) {
            case 'CREATED':
                return '➕';
            case 'UPDATED':
                return '✏️';
            case 'STATUS_CHANGED':
                return '🔄';
            case 'STAGE_CHANGED':
                return '📊';
            case 'ASSIGNED':
                return '👤';
            case 'PRIORITY_SET':
                return '⚠️';
            case 'DELETED':
                return '🗑️';
            default:
                return '📝';
        }
    };

    const getActionColor = (action: string): string => {
        switch (action.toUpperCase()) {
            case 'CREATED':
                return '#10b981'; // green
            case 'UPDATED':
                return '#3b82f6'; // blue
            case 'STATUS_CHANGED':
                return '#8b5cf6'; // purple
            case 'STAGE_CHANGED':
                return '#f59e0b'; // amber
            case 'ASSIGNED':
                return '#06b6d4'; // cyan
            case 'PRIORITY_SET':
                return '#ef4444'; // red
            case 'DELETED':
                return '#6b7280'; // gray
            default:
                return '#6b7280';
        }
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatChanges = (item: FileHistory) => {
        if (item.oldValues && item.newValues) {
            const oldVals = item.oldValues;
            const newVals = item.newValues;

            return (
                <div className="change-details">
                    {oldVals && <div className="old-value">From: {JSON.stringify(oldVals)}</div>}
                    {newVals && <div className="new-value">To: {JSON.stringify(newVals)}</div>}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return <div className="timeline-loading">Loading history...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="timeline-empty">
                <p>No activity history yet</p>
            </div>
        );
    }

    return (
        <div className="activity-timeline">
            {history.map((item) => (
                <div key={item.id} className="timeline-item">
                    <div
                        className="timeline-icon"
                        style={{ backgroundColor: getActionColor(item.action) }}
                    >
                        <span>{getActionIcon(item.action)}</span>
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <span className="timeline-user">
                                {item.user.firstName} {item.user.lastName}
                            </span>
                            <span className="timeline-action">{item.action.toLowerCase().replace('_', ' ')}</span>
                        </div>
                        {item.description && (
                            <div className="timeline-description">{item.description}</div>
                        )}
                        {formatChanges(item)}
                        <div className="timeline-time">{formatTime(item.createdAt)}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
