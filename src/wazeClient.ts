import 'dotenv/config';
import axios from 'axios';

export interface WazeAlert {
    country?: string;
    city?: string;
    reportRating?: number;
    reportByMunicipalityUser?: string; // "true"/"false"
    confidence?: number;
    reliability?: number;
    type: string;                      // ACCIDENT, ROAD_CLOSED, HAZARD, JAM
    uuid: string;
    roadType?: number;
    magvar?: number;
    subtype?: string;
    street?: string;
    location: {
        x: number; // lon
        y: number; // lat
    };
    pubMillis: number;
}

export interface WazeFeed {
    alerts?: WazeAlert[];
    // también vienen irregularities, etc., pero para el ingestor de ahora
    // solo nos interesan alerts
}

export async function fetchWazeFeed(): Promise<WazeFeed> {
    const url = process.env.WAZE_FEED_URL;
    if (!url) {
        throw new Error('WAZE_FEED_URL no está configurada en el .env');
    }

    const res = await axios.get<WazeFeed>(url, {
        timeout: 10000,
    });

    return res.data;
}
