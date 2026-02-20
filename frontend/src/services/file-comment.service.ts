import apiClient from './api';

export interface FileComment {
    id: string;
    poiFileId: string;
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    comment: string;
    isInternal: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCommentData {
    comment: string;
    isInternal?: boolean;
}

export interface CommentsResponse {
    comments: FileComment[];
}

class FileCommentService {
    /**
     * Get all comments for a POI file
     */
    async getComments(poiFileId: string, includeInternal: boolean = true): Promise<FileComment[]> {
        const response = await apiClient.get<CommentsResponse>(
            `/poi-files/${poiFileId}/comments`,
            { params: { includeInternal } }
        );
        return response.data.comments;
    }

    /**
     * Create a new comment
     */
    async createComment(poiFileId: string, data: CreateCommentData): Promise<FileComment> {
        const response = await apiClient.post<FileComment>(
            `/poi-files/${poiFileId}/comments`,
            data
        );
        return response.data;
    }

    /**
     * Update a comment
     */
    async updateComment(commentId: string, comment: string): Promise<FileComment> {
        const response = await apiClient.put<FileComment>(
            `/comments/${commentId}`,
            { comment }
        );
        return response.data;
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId: string): Promise<void> {
        await apiClient.delete(`/comments/${commentId}`);
    }
}

export default new FileCommentService();
