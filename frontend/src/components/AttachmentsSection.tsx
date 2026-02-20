import React, { useState, useEffect, useRef } from 'react';
import fileAttachmentService, { type FileAttachment } from '../services/file-attachment.service';
import { useAuth } from '../contexts/AuthContext';
import './AttachmentsSection.css';

interface AttachmentsSectionProps {
    poiFileId: string;
}

const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({ poiFileId }) => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [category, setCategory] = useState('');

    useEffect(() => {
        loadAttachments();
    }, [poiFileId]);

    const loadAttachments = async () => {
        try {
            setLoading(true);
            const data = await fileAttachmentService.getAttachments(poiFileId);
            setAttachments(data);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        handleUpload(files[0]);
    };

    const handleUpload = async (file: File) => {
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            await fileAttachmentService.uploadAttachment(poiFileId, file, category || undefined);
            setCategory('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            await loadAttachments();
        } catch (error: any) {
            console.error('Failed to upload file:', error);
            alert(error.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (attachment: FileAttachment) => {
        try {
            await fileAttachmentService.downloadAttachment(attachment.id, attachment.filename);
        } catch (error) {
            console.error('Failed to download file:', error);
            alert('Failed to download file');
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (!window.confirm('Are you sure you want to delete this attachment?')) return;

        try {
            await fileAttachmentService.deleteAttachment(attachmentId);
            await loadAttachments();
        } catch (error) {
            console.error('Failed to delete attachment:', error);
            alert('Failed to delete attachment');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays < 1) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const isOwnAttachment = (attachment: FileAttachment) => {
        return attachment.uploadedBy === user?.id;
    };

    if (loading) {
        return <div className="attachments-loading">Loading attachments...</div>;
    }

    return (
        <div className="attachments-section">
            <div className="attachments-header">
                <h3>Attachments ({attachments.length})</h3>
            </div>

            <div
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
            >
                <div className="upload-icon">📁</div>
                <p className="upload-text">
                    Drag and drop a file here, or{' '}
                    <label className="upload-browse">
                        browse
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => handleFileSelect(e.target.files)}
                            style={{ display: 'none' }}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
                        />
                    </label>
                </p>
                <p className="upload-hint">PDF, DOC, XLS, Images (Max 10MB)</p>

                {category !== undefined && (
                    <div className="upload-category">
                        <input
                            type="text"
                            placeholder="Category (optional)"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="category-input"
                        />
                    </div>
                )}

                {uploading && (
                    <div className="upload-progress">
                        <div className="progress-spinner"></div>
                        <span>Uploading...</span>
                    </div>
                )}
            </div>

            <div className="attachments-list">
                {attachments.length === 0 ? (
                    <div className="attachments-empty">
                        No attachments yet. Upload a file to get started!
                    </div>
                ) : (
                    attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                            <div className="attachment-icon">
                                {fileAttachmentService.getFileIcon(attachment.fileType)}
                            </div>
                            <div className="attachment-info">
                                <div className="attachment-name">{attachment.filename}</div>
                                <div className="attachment-meta">
                                    <span className="attachment-size">
                                        {fileAttachmentService.formatFileSize(attachment.fileSize)}
                                    </span>
                                    <span className="attachment-separator">•</span>
                                    <span className="attachment-uploader">
                                        {attachment.uploadedByUser.firstName} {attachment.uploadedByUser.lastName}
                                    </span>
                                    <span className="attachment-separator">•</span>
                                    <span className="attachment-date">
                                        {formatDate(attachment.createdAt)}
                                    </span>
                                    {attachment.category && (
                                        <>
                                            <span className="attachment-separator">•</span>
                                            <span className="attachment-category">{attachment.category}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="attachment-actions">
                                <button
                                    onClick={() => handleDownload(attachment)}
                                    className="attachment-action-btn download"
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                                {isOwnAttachment(attachment) && (
                                    <button
                                        onClick={() => handleDelete(attachment.id)}
                                        className="attachment-action-btn delete"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AttachmentsSection;
