# FLOW-app Køreplan til Stabilisering

**Version:** 3.10.3
**Oprettet:** 2026-02-05

---

## Overordnet Status

| Modul | Kortlagt | Testet | Fejl | Progress |
|-------|----------|--------|------|----------|
| Authentication | ✅ | ⬜ | 0 | 10% |
| Dashboard | ✅ | ⬜ | 0 | 10% |
| Kunder/CRM | ✅ | ⬜ | 0 | 10% |
| Leads | ✅ | ⬜ | 0 | 10% |
| Salg & Ordrer | ✅ | ⬜ | 0 | 10% |
| Rapporter | ✅ | ⬜ | 0 | 10% |
| Marketing/Loyalty | ✅ | ⬜ | 0 | 10% |
| App Builder | ✅ | ⬜ | 0 | 10% |
| Web Builder | ✅ | ⬜ | 0 | 10% |
| **Flow CMS** | ✅ | 🔄 | 2 | 25% |
| Settings | ✅ | ⬜ | 0 | 10% |
| Integrationer | ✅ | ⬜ | 0 | 10% |
| Landing Pages | ✅ | ⬜ | 0 | 10% |
| **TOTAL** | **100%** | **5%** | **2** | **12%** |

---

## Fase 1: Kritiske Fixes (P0-P1)

### Milestone 1: CMS Stabilisering
**Target:** Fix CMS Side Editor

| Task | Beskrivelse | Estimat | Afhængighed | Status |
|------|-------------|---------|-------------|--------|
| CMS-001 | Debug "Indstillinger" tab issue | 2h | - | 🔄 |
| CMS-002 | Debug "Planlæg" button issue | 1h | CMS-001 | ⬜ |
| CMS-003 | Verify getCurrentCMSPage() | 1h | - | ✅ |
| CMS-004 | Add fallback for empty page selection | 1h | CMS-003 | ⬜ |

**Risici:**
- JavaScript fejl kan blokere hele modulet
- Race condition ved async loading

**Mitigation:**
- Tilføj defensive null-checks
- Tilføj bedre error logging

---

### Milestone 2: Authentication Verification
**Target:** Sikre login/logout flow virker

| Task | Beskrivelse | Estimat | Status |
|------|-------------|---------|--------|
| AUTH-001 | Test login med Supabase | 1h | ⬜ |
| AUTH-002 | Test session persistence | 30m | ⬜ |
| AUTH-003 | Test 2FA flow | 1h | ⬜ |
| AUTH-004 | Verify logout clears all state | 30m | ⬜ |

---

## Fase 2: Core Functionality Test (P2)

### Milestone 3: CRUD Operations
| Task | Beskrivelse | Estimat | Status |
|------|-------------|---------|--------|
| CRUD-001 | Test kunde oprettelse | 1h | ⬜ |
| CRUD-002 | Test produkt CRUD | 1h | ⬜ |
| CRUD-003 | Test ordre flow | 1h | ⬜ |
| CRUD-004 | Test kampagne CRUD | 1h | ⬜ |

### Milestone 4: Builder Verification
| Task | Beskrivelse | Estimat | Status |
|------|-------------|---------|--------|
| BUILD-001 | Test App Builder save | 2h | ⬜ |
| BUILD-002 | Test Web Builder save | 2h | ⬜ |
| BUILD-003 | Test template rendering | 1h | ⬜ |

---

## Fase 3: Full Regression (P3)

### Milestone 5: Landing Pages
| Task | Beskrivelse | Estimat | Status |
|------|-------------|---------|--------|
| LP-001 | Test alle 33 landing pages loader | 2h | ⬜ |
| LP-002 | Test navigation links | 1h | ⬜ |
| LP-003 | Test responsive layouts | 2h | ⬜ |

### Milestone 6: Reports & Analytics
| Task | Beskrivelse | Estimat | Status |
|------|-------------|---------|--------|
| REP-001 | Test alle 7 rapport sider | 2h | ⬜ |
| REP-002 | Verify data aggregation | 1h | ⬜ |

---

## Risiko Register

| ID | Risiko | Impact | Sandsynlighed | Mitigation |
|----|--------|--------|---------------|------------|
| R1 | Supabase connection fejl | Høj | Lav | Offline fallback |
| R2 | LocalStorage quota exceeded | Medium | Medium | Data pruning |
| R3 | CSS konflikt i light mode | Lav | Medium | CSS variable audit ✅ |
| R4 | Race conditions i async | Medium | Medium | Defensive coding |

---

## Metrics

### Definition of Done Kriterer

1. ✅ Alle P0 issues løst
2. ⬜ Alle P1 issues løst
3. ⬜ Core workflows gennemførbare
4. ⬜ Ingen blokerende console errors
5. ⬜ Test checkliste minimum 80% pass

### Progress Tracking

| Uge | Target | Actual |
|-----|--------|--------|
| Uge 1 | 30% | 12% |
| Uge 2 | 60% | - |
| Uge 3 | 90% | - |
| Uge 4 | 100% | - |

---

## Næste Skridt (Prioriteret)

1. **IMMEDIAT:** Få bruger til at køre browser devtools og rapportere console output for CMS Indstillinger tab
2. **HØRES:** Test authentication flow end-to-end
3. **DENNE UGE:** Gennemfør tests for Dashboard og Kunder moduler
4. **LØBENDE:** Dokumenter alle fundne issues i TEST_CHECKLIST.md

---

**Sidst opdateret:** 2026-02-05
