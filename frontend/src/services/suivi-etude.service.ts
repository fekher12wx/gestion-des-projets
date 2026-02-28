import apiClient from './api';

export interface SuiviEtudeRow {
    id: string;
    secteur: string;
    nbDossiers: number;
    dreKo: number;
    vtAFaire: number;
    aRemonter: number;
    retourVt: number;
    dossAReprendre: number;
    dossAMonter: number;
    attInfosCafRef: number;
    attDevisOrangeRip: number;
    attDevisClient: number;
    attTravauxClient: number;
    attPv: number;
    attDta: number;
    attComacCafft: number;
    attMajSi: number;
    poiEnTravaux: number;
    atRetourDoe: number;
    recolAFaire: number;
    etat5: number;
    dossierMainBe: number;
    dossierMainChaff: number;
    createdAt: string;
    updatedAt: string;
}

export interface SuiviEtudeTotals {
    nbDossiers: number;
    dreKo: number;
    vtAFaire: number;
    aRemonter: number;
    retourVt: number;
    dossAReprendre: number;
    dossAMonter: number;
    attInfosCafRef: number;
    attDevisOrangeRip: number;
    attDevisClient: number;
    attTravauxClient: number;
    attPv: number;
    attDta: number;
    attComacCafft: number;
    attMajSi: number;
    poiEnTravaux: number;
    atRetourDoe: number;
    recolAFaire: number;
    etat5: number;
    dossierMainBe: number;
    dossierMainChaff: number;
}

export interface SuiviEtudeListResponse {
    rows: SuiviEtudeRow[];
    totals: SuiviEtudeTotals;
    tauxNonConformite: string;
}

class SuiviEtudeService {
    async getAll(): Promise<SuiviEtudeListResponse> {
        const response = await apiClient.get<SuiviEtudeListResponse>('/suivi-etudes');
        return response.data;
    }

    async create(data: Partial<SuiviEtudeRow>): Promise<SuiviEtudeRow> {
        const response = await apiClient.post<{ row: SuiviEtudeRow }>('/suivi-etudes', data);
        return response.data.row;
    }

    async update(id: string, data: Partial<SuiviEtudeRow>): Promise<SuiviEtudeRow> {
        const response = await apiClient.put<{ row: SuiviEtudeRow }>(`/suivi-etudes/${id}`, data);
        return response.data.row;
    }

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/suivi-etudes/${id}`);
    }

    async updateColumns(id: string, columnConfig: any[]): Promise<SuiviEtudeRow> {
        const response = await apiClient.put<{ row: SuiviEtudeRow }>(`/suivi-etudes/${id}/columns`, { columnConfig });
        return response.data.row;
    }
}

export default new SuiviEtudeService();
