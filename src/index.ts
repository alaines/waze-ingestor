import 'dotenv/config';
import { pool } from './db';
import { fetchWazeFeed } from './wazeClient';
import { normalizeAlert, NormalizedIncident } from './normalizer';

async function upsertIncident(inc: NormalizedIncident): Promise<void> {
    const query = `
    INSERT INTO waze_incidents (
      uuid, type, subtype, city, street,
      road_type, magvar, report_rating, report_by_muni,
      confidence, reliability, pub_millis,
      geom, category, priority, updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12,
      ST_SetSRID(ST_MakePoint($13, $14), 4326)::geography,
      $15, $16, now()
    )
    ON CONFLICT (uuid)
    DO UPDATE SET
      type           = EXCLUDED.type,
      subtype        = EXCLUDED.subtype,
      city           = EXCLUDED.city,
      street         = EXCLUDED.street,
      road_type      = EXCLUDED.road_type,
      magvar         = EXCLUDED.magvar,
      report_rating  = EXCLUDED.report_rating,
      report_by_muni = EXCLUDED.report_by_muni,
      confidence     = EXCLUDED.confidence,
      reliability    = EXCLUDED.reliability,
      pub_millis     = EXCLUDED.pub_millis,
      geom           = EXCLUDED.geom,
      category       = EXCLUDED.category,
      priority       = EXCLUDED.priority,
      updated_at     = now();
  `;

    const values = [
        inc.uuid,
        inc.type,
        inc.subtype,
        inc.city,
        inc.street,
        inc.road_type,
        inc.magvar,
        inc.report_rating,
        inc.report_by_muni,
        inc.confidence,
        inc.reliability,
        inc.pub_millis,
        inc.lon,
        inc.lat,
        inc.category,
        inc.priority,
    ];

    await pool.query(query, values);
}

async function clearMissingAlerts(currentUuids: string[]): Promise<number> {
    // Si por alguna razón no hay alerts, evitamos hacer un NOT ANY sobre array vacío.
    if (currentUuids.length === 0) {
        return 0;
    }

    const query = `
    UPDATE waze_incidents
    SET status = 'cleared',
        updated_at = now()
    WHERE source = 'waze'
      AND status = 'active'
      AND NOT (uuid = ANY($1))
      -- opcional: solo limpiar los que no se actualizan hace un rato
      AND updated_at < now() - interval '10 minutes'
  `;

    const result = await pool.query(query, [currentUuids]);
    return result.rowCount ?? 0;
}

async function runOnce(): Promise<void> {
    console.log('Consultando feed de Waze...');
    const data = await fetchWazeFeed();

    const alerts = data.alerts ?? [];
    console.log(`Alerts recibidos: ${alerts.length}`);

    let processed = 0;
    const currentUuids: string[] = [];

    for (const alert of alerts) {
        const inc = normalizeAlert(alert);
        if (!inc) continue;

        await upsertIncident(inc);
        processed++;
        currentUuids.push(inc.uuid);
    }

    console.log(`Incidentes procesados/guardados: ${processed}`);

    const cleared = await clearMissingAlerts(currentUuids);
    console.log(`Incidentes marcados como 'cleared': ${cleared}`);
}

runOnce()
    .then(async () => {
        console.log('Fin de ejecución.');
        await pool.end();
    })
    .catch(async (err) => {
        console.error('Error en ejecución:', err);
        await pool.end();
        process.exit(1);
    });
