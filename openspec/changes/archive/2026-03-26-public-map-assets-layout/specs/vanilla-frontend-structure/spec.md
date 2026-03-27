## MODIFIED Requirements

### Requirement: Directory roles at repository root

The repository root MUST contain `index.html` as the navigation hub for tools. Standalone tool entry HTML files MUST live under a single dedicated directory named `pages/` (sibling to `css/`, `js/`, and `public/`). Shared static data for map tools MUST remain under `public/` with stable subfolders: map metadata JSON under **`public/map/json/`**, radar PNG under **`public/map/png/`**, and Valve overview source `.txt` files under **`public/map/raw/`** (all under `public/map/`). Source `.txt` MAY coexist with PNG and JSON for the same map; workflows MUST NOT delete raw txt solely because a radar PNG exists. Optional Node-based preprocessing scripts MUST reside under `scripts/` and MUST NOT be required in the browser at runtime.

#### Scenario: Locating static data

- **WHEN** a contributor looks for map metadata, radar images, or source txt files
- **THEN** they MUST locate JSON under `public/map/json/`, PNG under `public/map/png/`, and source txt under `public/map/raw/`, not at `public/json/` or `public/png/` at repository root
