You are an expert Frontend Architect utilizing the Figma Model Context Protocol (MCP) server. Treat this Figma link as the absolute, single source of truth (SSOT) for all UI, typography, layouts, colors, and design parameters: 
👉 https://www.figma.com/design/m7BoDc2ZW6aLacovnsFkUL/ChatGPTBudgetApp?node-id=0-1&t=UYOJ5P3qkpkFOkFt-1

Your immediate task is to audit the entire design file, map its elements, and create a localized architecture tracking system. Do not write the final application code yet. Instead, follow these steps sequentially:

1. INITIAL SETUP:
Create a folder in the root directory named `figmaAsset`. This folder will host the foundational definitions required to perfectly reproduce the UI layout down to the exact pixel.

2. DESIGN AUDIT & CONTEXT EXTRACTION:
- Use the `get_metadata` or `get_design_context` MCP tools to crawl the provided Figma URL.
- Extract every Parent Frame, Component, Instance, and nested element found inside node-id=0-1. 
- Map all Native Variables (primitives/semantics), design tokens, spacing rules, and typography hierarchies.

3. REPO CREATION INSIDE `figmaAsset`:
Inside the `figmaAsset` folder, generate the following structured schema files:

   a) `figmaAsset/tokens.json` (or .yaml):
      An exhaustive inventory of every color variable, background hex code, corner radius, text style (font-size, line-height, weight), spacing/padding step, and responsive breakpoint captured from the file.

   b) `figmaAsset/layout_manifest.json`:
      A structural map detailing each individual canvas frame. For every frame, extract:
      - The absolute positioning, layout grid, or Auto Layout configuration (direction, gap, alignment).
      - An anatomy tree showing layer nesting.
      - Component names and variant states (e.g., button status: hover, disabled, active).

   c) `figmaAsset/extracted_data.md`:
      A comprehensive plain-text document documenting all copywriting text, placeholder strings, form input labels, data structures, and asset paths found on the frames so we don't hallucinate data.

4. ALIGNMENT & QUALITY ASSURANCE:
- Ensure all elements use your internal layout representations matching Figma's exact Auto Layout constraints. 
- Use the `get_screenshot` tool to visually compare your mapped architecture frames against the original canvas file. Re-iterate if any layout dimension gaps or layer mismatches are discovered.

Acknowledge these instructions, execute the necessary Figma MCP tool calls to inspect the file, and output the directory structure and contents for the `figmaAsset` folder now.
