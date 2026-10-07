# Import without losing existing work
1. Extract the ZIP outside the repository.
2. Ask Claude to compare the kit with the current assets directory and root instructions.
3. Merge new files; preserve existing scripts, manifest.json and newer artwork.
4. Keep art-kit.manifest.json separate until a deliberate schema mapping is reviewed.
5. Read AGENTS.md here and merge compatible instructions with any existing assets/AGENTS.md.
6. Use images only as source/reference until approved and runtime-validated.
7. Inspect the source concepts with an image viewer before writing integration code.
8. Keep production app paths unchanged until the pilot is ready.
9. Make a documentation/assets branch; no automatic merge or deploy.

Suggested instruction:
"Merge this art kit safely. Read its catalog and image references. Identify missing
production assets and prepare the Warrior/Bat pilot integration. Do not generate
geometric replacement characters or claim the concept board is an animation sheet.
Preserve newer repository work and report what still needs actual art production."
