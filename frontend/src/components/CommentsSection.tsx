import React, { useState, useEffect } from 'react';
import fileCommentService, { type FileComment } from '../services/file-comment.service';
import { useAuth } from '../contexts/AuthContext';
import './CommentsSection.css';

interface CommentsSectionProps {
    poiFileId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ poiFileId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<FileComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isInternal, setIsInternal] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [poiFileId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const data = await fileCommentService.getComments(poiFileId, true);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            await fileCommentService.createComment(poiFileId, {
                comment: newComment,
                isInternal,
            });
            setNewComment('');
            setIsInternal(true);
            await loadComments();
        } catch (error) {
            console.error('Failed to create comment:', error);
            alert('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (comment: FileComment) => {
        setEditingId(comment.id);
        setEditText(comment.comment);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleSaveEdit = async (commentId: string) => {
        if (!editText.trim()) return;

        try {
            await fileCommentService.updateComment(commentId, editText);
            setEditingId(null);
            setEditText('');
            await loadComments();
        } catch (error) {
            console.error('Failed to update comment:', error);
            alert('Failed to update comment');
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            await fileCommentService.deleteComment(commentId);
            await loadComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('Failed to delete comment');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const getUserInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const isOwnComment = (comment: FileComment) => {
        return comment.userId === user?.id;
    };

    if (loading) {
        return <div className="comments-loading">Loading comments...</div>;
    }

    return (
        <div className="comments-section">
            <div className="comments-header">
                <h3>Comments ({comments.length})</h3>
            </div>

            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="comments-empty">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className={`comment-item ${comment.isInternal ? 'internal' : 'external'}`}>
                            <div className="comment-avatar">
                                {getUserInitials(comment.user.firstName, comment.user.lastName)}
                            </div>
                            <div className="comment-content">
                                <div className="comment-meta">
                                    <span className="comment-author">
                                        {comment.user.firstName} {comment.user.lastName}
                                    </span>
                                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                    {comment.isInternal && (
                                        <span className="comment-badge internal">Internal</span>
                                    )}
                                </div>

                                {editingId === comment.id ? (
                                    <div className="comment-edit-form">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="comment-edit-input"
                                        />
                                        <div className="comment-edit-actions">
                                            <button
                                                onClick={() => handleSaveEdit(comment.id)}
                                                className="btn-save"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="btn-cancel"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="comment-text">{comment.comment}</p>
                                        {isOwnComment(comment) && (
                                            <div className="comment-actions">
                                                <button
                                                    onClick={() => handleEdit(comment)}
                                                    className="comment-action-btn"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="comment-action-btn delete"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                    rows={3}
                />
                <div className="comment-form-footer">
                    <label className="comment-checkbox">
                        <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                        />
                        <span>Internal only</span>
                    </label>
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="btn-submit"
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommentsSection;
