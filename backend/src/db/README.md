# Database Module

## Purpose
Provides database utilities and data access layer for TicoBot.

## Responsibilities
- Database connection management
- Schema migrations
- Document metadata storage
- Query helpers
- Transaction management
- Data validation

## Folder Structure

    db/
    ├── repositories/         # Repository pattern implementations
    │   ├── DocumentRepository.ts   # Document CRUD operations
    │   ├── ChunkRepository.ts      # Chunk CRUD operations
    │   └── BaseRepository.ts       # Base repository class
    ├── migrations/           # Database schema migrations
    │   ├── 001_initial_schema.sql
    │   └── migration-runner.ts
    ├── schemas/              # Schema definitions
    │   └── schema.sql              # Complete database schema
    ├── README.md             # This file
    └── index.ts              # Public API exports

## Dependencies
- Database provider from @ticobot/shared
- Supabase client (or configured DB provider)