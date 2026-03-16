# Lab object → Dữ liệu (mapping)

Nguồn: **`interactionMap.ts`** (`INTERACTION_MAP`). Collect trong **`InteractiveScreens.tsx`** dùng `getInteractionEntry(meshName)`.

## Bảng mapping hiện tại

| Object name (trong GLB) | Section / Panel | Label            |
|-------------------------|-----------------|------------------|
| **skills_reactor**      | skills          | Skills           |
| **projects_lab**       | project (index 0) | Project showcase |
| **about_table**        | about           | About me         |
| **projects_console**   | project (index 1) | Project demo     |
| **contact_door**       | contact         | Contact          |
| **experience_server**  | experience      | Experience       |
| **timeline_pipes**     | experience      | Career timeline  |

## Chi tiết

- **Project:** `projects_lab` → mở project index 0 (GuardianX). `projects_console` → mở project index 1 (ADS & SOP). Dữ liệu project lấy từ `projects.ts` (`PROJECTS`).
- **Section:** Click object → mở panel About / Skills / Experience / Contact tương ứng; label khi hover theo cột "Label".
- **Career timeline:** Cùng section experience, chỉ khác label "Career timeline".

## Code

- **Map:** `interactionMap.ts` — `INTERACTION_MAP`, `getInteractionEntry`.
- **Collect:** `InteractiveScreens.tsx` — `collectScreens` (entry.portfolioSection === 'project'), `collectSectionObjects` (section khác 'project'), `meshName(mesh)` (mesh.name hoặc parent.name).
