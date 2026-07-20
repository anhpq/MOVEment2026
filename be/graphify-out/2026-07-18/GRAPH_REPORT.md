# Graph Report - be  (2026-07-18)

## Corpus Check
- 48 files · ~11,562 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 422 nodes · 875 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff236a20`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- final.controller.ts
- PrismaService
- AuthContext
- AdminService
- devDependencies
- auth.controller.ts
- dependencies
- app.module.ts
- PlayerService
- scripts
- compilerOptions
- player.controller.ts
- exclude
- nest-cli.json
- MOVEment 2026 Backend
- seed.ts
- deploy.sh
- jest.config.ts
- README.md

## God Nodes (most connected - your core abstractions)
1. `AuthContext` - 33 edges
2. `AdminService` - 28 edges
3. `CurrentAuth` - 25 edges
4. `PrismaService` - 25 edges
5. `PlayerService` - 23 edges
6. `AdminController` - 20 edges
7. `FinalService` - 18 edges
8. `ActivityLogService` - 17 edges
9. `EventConfigService` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `AppModule`  [INFERRED]
  src/main.ts → src/app.module.ts
- `AdminController` --references--> `Roles()`  [EXTRACTED]
  src/modules/admin/admin.controller.ts → src/common/auth/auth.decorators.ts

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "final.controller.ts"
Cohesion: 0.07
Nodes (26): ArrayMinSize, IsArray, IsBoolean, IsISO8601, AdminAuthContext, AuthType, isAdmin(), TeamAuthContext (+18 more)

### Community 1 - "PrismaService"
Cohesion: 0.07
Nodes (21): Matches, ActivityLogService, Injectable, JwtAuthGuard, JwtPayload, Injectable, ReopenProgressDto, IsInt (+13 more)

### Community 2 - "AuthContext"
Cohesion: 0.13
Nodes (18): Res, AuthContext, CurrentAuth, AdminController, Body, Controller, Get, Param (+10 more)

### Community 3 - "AdminService"
Cohesion: 0.09
Nodes (15): AdminService, Injectable, cellXml(), columnName(), crc32(), crcTable, createWorkbookXlsx(), escapeXml() (+7 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (33): eslint, globals, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, devDependencies, eslint (+25 more)

### Community 5 - "auth.controller.ts"
Cohesion: 0.13
Nodes (17): isTeam(), AuthController, mockAuthService, Body, Controller, Get, Post, UseGuards (+9 more)

### Community 6 - "dependencies"
Cohesion: 0.07
Nodes (29): bcryptjs, class-transformer, class-validator, helmet, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+21 more)

### Community 7 - "app.module.ts"
Cohesion: 0.09
Nodes (21): Global, AppModule, Module, Environment, requiredProductionValue(), productionEnvironment, validateEnvironment(), bootstrap() (+13 more)

### Community 9 - "scripts"
Cohesion: 0.10
Nodes (19): description, license, name, prisma, seed, private, scripts, build (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): src/**/*.ts, compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental (+11 more)

### Community 11 - "player.controller.ts"
Cohesion: 0.21
Nodes (14): IsEnum, MaxLength, ForceProgressStatusDto, SubmitScoreDto, TeamSubmitScoreDto, IsInt, IsOptional, IsString (+6 more)

### Community 12 - "exclude"
Cohesion: 0.22
Nodes (8): dist, node_modules, **/*.spec.ts, test, ./tsconfig.json, exclude, extends, prisma/**/*.ts

### Community 13 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 14 - "MOVEment 2026 Backend"
Cohesion: 0.33
Nodes (5): Auth Smoke Test, Main APIs, MOVEment 2026 Backend, Seed Accounts, Setup

### Community 15 - "seed.ts"
Cohesion: 0.40
Nodes (3): prisma, stations, teams

## Knowledge Gaps
- **97 isolated node(s):** `deploy.sh script`, `NODE_ENV`, `config`, `$schema`, `collection` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthContext` connect `AuthContext` to `final.controller.ts`, `PrismaService`, `player.controller.ts`, `auth.controller.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `AdminService` connect `AdminService` to `PrismaService`, `AuthContext`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `PrismaService` to `final.controller.ts`, `AdminService`, `auth.controller.ts`, `PlayerService`, `player.controller.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `deploy.sh script`, `NODE_ENV`, `config` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `final.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._
- **Should `PrismaService` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._
- **Should `AuthContext` be split into smaller, more focused modules?**
  _Cohesion score 0.13356562137049943 - nodes in this community are weakly interconnected._