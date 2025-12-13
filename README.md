# Waze Ingestor

Sistema de ingesta de datos de tráfico en tiempo real desde Waze Feed hacia una base de datos PostgreSQL con PostGIS.

## Descripción

Este proyecto consulta periódicamente el feed público de Waze para obtener alertas de tráfico (accidentes, bloqueos, baches, congestiones, etc.) y las almacena en una base de datos PostgreSQL con capacidades geoespaciales. Los datos se normalizan y categorizan para facilitar su análisis posterior.

## Características

- Consulta automática del feed de Waze cada 3 minutos
- Normalización de alertas en categorías estándar
- Almacenamiento geoespacial usando PostGIS
- Sistema de priorización de incidentes
- Prevención de duplicados mediante UUID
- Actualización automática de registros existentes

## Categorías de Incidentes

El sistema clasifica los incidentes de Waze en las siguientes categorías:

- **accidente**: Accidentes de tráfico
- **bloqueo**: Cierres de vías
- **bache**: Baches en la vía
- **vehiculo_detenido**: Vehículos detenidos
- **obra**: Trabajos de construcción
- **peligro**: Otros peligros en la vía
- **congestion**: Congestión vehicular
- **otro**: Incidentes no clasificados

## Requisitos Previos

- Node.js 18 o superior
- PostgreSQL 12 o superior
- PostGIS 3.0 o superior

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/alaines/waze-ingestor.git
cd waze-ingestor
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno:

Crear un archivo `.env` en la raíz del proyecto:

```env
WAZE_FEED_URL=https://www.waze.com/row-partnerhub-api/partners/...
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=monitoreo_trafico
```

4. Crear la base de datos y tabla:

```sql
CREATE DATABASE monitoreo_trafico;

\c monitoreo_trafico

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE waze_incidents (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50),
  subtype VARCHAR(50),
  city VARCHAR(255),
  street VARCHAR(255),
  road_type INTEGER,
  magvar INTEGER,
  report_rating INTEGER,
  report_by_muni BOOLEAN,
  confidence INTEGER,
  reliability INTEGER,
  pub_millis BIGINT,
  geom GEOGRAPHY(POINT, 4326),
  category VARCHAR(50),
  priority INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waze_incidents_geom ON waze_incidents USING GIST(geom);
CREATE INDEX idx_waze_incidents_category ON waze_incidents(category);
CREATE INDEX idx_waze_incidents_priority ON waze_incidents(priority);
CREATE INDEX idx_waze_incidents_pub_millis ON waze_incidents(pub_millis);
```

## Uso

### Modo Desarrollo

```bash
npm run dev
```

### Modo Producción

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
waze-ingestor/
├── src/
│   ├── index.ts        # Punto de entrada y lógica principal
│   ├── wazeClient.ts   # Cliente HTTP para el feed de Waze
│   ├── normalizer.ts   # Normalización y categorización de alertas
│   └── db.ts           # Configuración de conexión a PostgreSQL
├── package.json
├── tsconfig.json
└── README.md
```

## Esquema de Datos

### Tabla: waze_incidents

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Identificador único autoincrementable |
| uuid | VARCHAR(255) | UUID único del incidente de Waze |
| type | VARCHAR(50) | Tipo de incidente (ACCIDENT, ROAD_CLOSED, etc.) |
| subtype | VARCHAR(50) | Subtipo específico del incidente |
| city | VARCHAR(255) | Ciudad donde ocurrió el incidente |
| street | VARCHAR(255) | Calle donde ocurrió el incidente |
| road_type | INTEGER | Tipo de vía |
| magvar | INTEGER | Variación magnética |
| report_rating | INTEGER | Calificación del reporte |
| report_by_muni | BOOLEAN | Si fue reportado por autoridad municipal |
| confidence | INTEGER | Nivel de confianza del reporte |
| reliability | INTEGER | Confiabilidad del reporte |
| pub_millis | BIGINT | Timestamp de publicación en milisegundos |
| geom | GEOGRAPHY | Ubicación geoespacial (PostGIS) |
| category | VARCHAR(50) | Categoría normalizada del incidente |
| priority | INTEGER | Prioridad calculada (1-3) |
| created_at | TIMESTAMP | Fecha de creación del registro |
| updated_at | TIMESTAMP | Fecha de última actualización |

## Cálculo de Prioridad

El sistema asigna prioridades de 1 a 3 basándose en:

- **Prioridad 1 (Alta)**: Accidentes y bloqueos
- **Prioridad 2 (Media)**: Baches, vehículos detenidos y obras
- **Prioridad 3 (Baja)**: Otros peligros y congestiones

## Tecnologías Utilizadas

- **TypeScript**: Lenguaje de programación
- **Node.js**: Entorno de ejecución
- **PostgreSQL**: Base de datos relacional
- **PostGIS**: Extensión geoespacial para PostgreSQL
- **axios**: Cliente HTTP
- **pg**: Driver de PostgreSQL para Node.js
- **dotenv**: Gestión de variables de entorno

## Licencia

ISC

## Autor

alaines
