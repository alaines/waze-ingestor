import type { WazeAlert } from './wazeClient';

export type IncidentCategory =
    | 'accidente'
    | 'bloqueo'
    | 'bache'
    | 'vehiculo_detenido'
    | 'obra'
    | 'peligro'
    | 'congestion'
    | 'otro';

export interface NormalizedIncident {
    uuid: string;
    type: string;
    subtype: string | null;
    city: string | null;
    street: string | null;
    road_type: number | null;
    magvar: number | null;

    report_rating: number | null;
    report_by_muni: boolean;
    confidence: number | null;
    reliability: number | null;

    pub_millis: number;

    lon: number;
    lat: number;

    category: IncidentCategory;
    priority: number;
}

function inferCategory(type: string, subtype: string): IncidentCategory {
    if (type === 'ACCIDENT') return 'accidente';
    if (type === 'ROAD_CLOSED') return 'bloqueo';

    if (type === 'HAZARD') {
        if (subtype.includes('POT_HOLE')) return 'bache';
        if (subtype.includes('CAR_STOPPED')) return 'vehiculo_detenido';
        if (subtype.includes('CONSTRUCTION')) return 'obra';
        return 'peligro';
    }

    if (type === 'JAM') return 'congestion';

    return 'otro';
}

function inferPriority(category: IncidentCategory): number {
    switch (category) {
        case 'accidente':
            return 1;
        case 'bloqueo':
            return 2;
        case 'peligro':
        case 'vehiculo_detenido':
        case 'obra':
            return 3;
        case 'congestion':
            return 4;
        default:
            return 5;
    }
}

/**
 * Normaliza un alert de Waze al formato usado en BD.
 * Devuelve null si no nos interesa ese tipo o falta info importante.
 */
export function normalizeAlert(alert: WazeAlert): NormalizedIncident | null {
    const interestingTypes = ['ACCIDENT', 'ROAD_CLOSED', 'HAZARD', 'JAM'];

    if (!interestingTypes.includes(alert.type)) {
        return null;
    }

    if (!alert.location || alert.location.x == null || alert.location.y == null) {
        return null;
    }

    const subtype = alert.subtype ?? '';
    const category = inferCategory(alert.type, subtype);
    const priority = inferPriority(category);

    return {
        uuid: alert.uuid,
        type: alert.type,
        subtype: alert.subtype ?? null,
        city: alert.city ?? null,
        street: alert.street ?? null,
        road_type: alert.roadType ?? null,
        magvar: alert.magvar ?? null,

        report_rating: alert.reportRating ?? null,
        report_by_muni: alert.reportByMunicipalityUser === 'true',
        confidence: alert.confidence ?? null,
        reliability: alert.reliability ?? null,

        pub_millis: alert.pubMillis,

        lon: alert.location.x,
        lat: alert.location.y,

        category,
        priority,
    };
}
