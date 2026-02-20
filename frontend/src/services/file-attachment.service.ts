import apiClient from './api';

export interface FileAttachment {
    id: string;
    poiFileId: string;
    uploadedBy: string;
    uploadedByUser: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    filename: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    category?: string;
    createdAt: string;
}

export interface AttachmentsResponse {
    attachments: FileAttachment[];
}

class FileAttachmentService {
    /**
     * Get all attachments for a POI file
     */
    async getAttachments(poiFileId: string): Promise<FileAttachment[]> {
        const response = await apiClient.get<AttachmentsResponse>(
            `/poi-files/${poiFileId}/attachments`
        );
        return response.data.attachments;
    }

    /**
     * Upload an attachment
     */
    async uploadAttachment(
        poiFileId: string,
        file: File,
        category?: string
    ): Promise<FileAttachment> {
        const formData = new FormData();
        formData.append('file', file);
        if (category) {
            formData.append('category', category);
        }

        const response = await apiClient.post<FileAttachment>(
            `/poi-files/${poiFileId}/attachments`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Download an attachment
     */
    async downloadAttachment(attachmentId: string, filename: string): Promise<void> {
        const response = await apiClient.get(`/attachments/${attachmentId}/download`, {
            responseType: 'blob',
        });

        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Delete an attachment
     */
    async deleteAttachment(attachmentId: string): Promise<void> {
        await apiClient.delete(`/attachments/${attachmentId}`);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get file type icon
     */
    getFileIcon(fileType: string): string {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('text')) return '📃';
        return '📎';
    }
}

export default new FileAttachmentService();
