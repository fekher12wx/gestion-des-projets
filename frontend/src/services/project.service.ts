import apiClient from './api';
import type { Project } from '../types';

class ProjectService {
    async getProjects(): Promise<Project[]> {
        const response = await apiClient.get<{ projects: Project[] }>('/projects');
        return response.data.projects;
    }

    async getAll(): Promise<Project[]> {
        return this.getProjects();
    }

    async getProject(id: string): Promise<Project> {
        const response = await apiClient.get<{ project: Project }>(`/projects/${id}`);
        return response.data.project;
    }

    async create(projectData: { name: string; code: string; clientId?: string; description?: string }): Promise<Project> {
        const response = await apiClient.post<{ project: Project }>('/projects', projectData);
        return response.data.project;
    }

    async update(id: string, projectData: { name: string; code: string; clientId?: string; description?: string }): Promise<Project> {
        const response = await apiClient.put<{ project: Project }>(`/projects/${id}`, projectData);
        return response.data.project;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/projects/${id}`);
    }
}

export default new ProjectService();
