# ADR 0001: Gobierno multiagente y Vite

- Estado: aceptada
- Fecha: 2026-07-18

## Contexto

El proyecto era una PWA estatica en una subcarpeta Git, con codigo de interfaz,
dominio y persistencia en un solo archivo. La carpeta exterior contenia copias
distintas y no existian reglas normativas, pruebas reproducibles ni CI.

## Decision

`outputs` es la unica raiz oficial. Se adopta Vite con JavaScript vanilla,
persistencia mediante `DataRepository`, PWA generada, ramas y worktrees exclusivos,
PR obligatorias y separacion estricta entre previews/staging y produccion.

## Consecuencias

- El proyecto se ejecuta mediante pnpm y HTTP; `file://` deja de ser compatible.
- Los agentes pueden trabajar por modulo con menos conflictos.
- Los cambios globales necesitan un integrador.
- El costo inicial aumenta por pruebas, CI y documentacion, pero cada entrega es
  reproducible y recuperable.
