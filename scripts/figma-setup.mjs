#!/usr/bin/env node

/**
 * Figma MVP Design System Setup Script
 *
 * This script interacts with the Figma REST API to:
 * 1. List existing files in the project
 * 2. Check for existing "Dreamer" file
 * 3. Generate a detailed JSON blueprint of the structure to create
 * 4. Provide clear manual setup instructions
 *
 * IMPORTANT API LIMITATIONS:
 * - Figma REST API v1 is primarily READ-ONLY for document structure
 * - File creation is NOT available via REST API
 * - Page and frame creation requires Figma Plugin API or manual creation
 * - The PUT /files endpoint has limited update capabilities
 *
 * WORKAROUND: This script generates a structured JSON blueprint that can be:
 * - Used as a reference for manual setup in Figma UI
 * - Passed to a Figma plugin that creates the structure
 * - Used to document the intended design system architecture
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const PROJECT_ID = '549616751';
const TEAM_ID = '1601969179625963422';

/**
 * Design system structure blueprint
 */
const DESIGN_SYSTEM_BLUEPRINT = {
  file: {
    name: 'Dreamer — MVP Design System & Screens',
    description: 'Jungian dreamwork app · MVP v1',
  },
  pages: [
    {
      name: '01 — Cover & Principles',
      frames: [
        {
          name: 'Cover',
          content: {
            title: 'Dreamer — MVP Design System & Screens',
            subtitle: 'Jungian dreamwork app · MVP v1',
            principles: [
              'Interpretations are hypotheses',
              'User meaning > system meaning',
              'Calm, reflective pacing',
            ],
            nonGoals: [
              'Not therapy',
              'Not diagnosis',
              'Not prediction',
            ],
          },
        },
      ],
    },
    {
      name: '02 — Foundations (Tokens)',
      frames: [
        { name: 'Colors', description: 'Color palette and token definitions' },
        { name: 'Typography', description: 'Font scales, weights, and line heights' },
        { name: 'Spacing', description: 'Spacing scale and layout tokens' },
        { name: 'Motion Notes', description: 'Animation curves and timing' },
      ],
    },
    {
      name: '03 — Atoms',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Basic UI elements: buttons, inputs, labels, icons, badges',
        },
      ],
    },
    {
      name: '04 — Molecules',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Component combinations: form fields, cards, lists, navigation',
        },
      ],
    },
    {
      name: '05 — Organisms (Optional)',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Complex sections: headers, footers, modals, sidebars',
        },
      ],
    },
    {
      name: '06 — Screens — Core Flow',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Main user journey: onboarding, dream capture, interpretation',
        },
      ],
    },
    {
      name: '07 — Screens — States & Edge Cases',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Loading states, errors, empty states, validation feedback',
        },
      ],
    },
    {
      name: '08 — Prototype Flows',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Interactive prototypes and user flow diagrams',
        },
      ],
    },
    {
      name: '09 — Dev Handoff',
      frames: [
        {
          name: 'Page Purpose',
          content: 'Specs, tokens export, component documentation for developers',
        },
      ],
    },
  ],
};

/**
 * Fetch wrapper with error handling
 */
async function figmaFetch(endpoint, options = {}) {
  const token = process.env.FIGMA_TOKEN;

  if (!token) {
    throw new Error(
      'FIGMA_TOKEN environment variable not set. Please set it before running this script.'
    );
  }

  const url = `${FIGMA_API_BASE}${endpoint}`;
  const headers = {
    'X-Figma-Token': token,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Figma API Error (${response.status}): ${error || response.statusText}`
    );
  }

  return response.json();
}

/**
 * List all files in the project
 */
async function listProjectFiles() {
  console.log(
    `\nFetching files from project ${PROJECT_ID}...`
  );
  const data = await figmaFetch(`/projects/${PROJECT_ID}/files`);
  return data.files || [];
}

/**
 * Check if a file already exists by name
 */
function findExistingFile(files, name) {
  return files.find((file) => file.name === name);
}

/**
 * Generate the setup instructions
 */
function generateSetupInstructions() {
  return `
╔════════════════════════════════════════════════════════════════════════════╗
║                     FIGMA DESIGN SYSTEM SETUP GUIDE                        ║
║                    Manual Creation Steps (REST API Limitation)             ║
╚════════════════════════════════════════════════════════════════════════════╝

LIMITATION: The Figma REST API v1 does not support creating files or pages
programmatically. The following steps must be completed manually in Figma:

STEP 1: Create the File
─────────────────────────────────────────────────────────────────────────────
1. In Figma, go to Team: "1601969179625963422"
2. Navigate to Project: "549616751"
3. Click "New file"
4. Name it: "Dreamer — MVP Design System & Screens"

STEP 2: Create Pages in Order
─────────────────────────────────────────────────────────────────────────────
In the Pages panel on the left, create these pages in this exact order:

  1. "01 — Cover & Principles"
  2. "02 — Foundations (Tokens)"
  3. "03 — Atoms"
  4. "04 — Molecules"
  5. "05 — Organisms (Optional)"
  6. "06 — Screens — Core Flow"
  7. "07 — Screens — States & Edge Cases"
  8. "08 — Prototype Flows"
  9. "09 — Dev Handoff"

STEP 3: Add Frames to Page "02 — Foundations (Tokens)"
─────────────────────────────────────────────────────────────────────────────
On page "02 — Foundations (Tokens)", create 4 labeled frames:

  • "Colors" — Color palette and token definitions
  • "Typography" — Font scales, weights, and line heights
  • "Spacing" — Spacing scale and layout tokens
  • "Motion Notes" — Animation curves and timing

STEP 4: Add Cover Frame to Page "01 — Cover & Principles"
─────────────────────────────────────────────────────────────────────────────
On page "01 — Cover & Principles", create a frame named "Cover" with:

  TITLE:
    "Dreamer — MVP Design System & Screens"

  SUBTITLE:
    "Jungian dreamwork app · MVP v1"

  UX PRINCIPLES:
    • Interpretations are hypotheses
    • User meaning > system meaning
    • Calm, reflective pacing

  NON-GOALS:
    • Not therapy
    • Not diagnosis
    • Not prediction

STEP 5: Add Purpose Frames to Remaining Pages
─────────────────────────────────────────────────────────────────────────────
For each page ("03 — Atoms" through "09 — Dev Handoff"):

  1. Create a text frame titled "Page Purpose"
  2. Add a description (see blueprint JSON below)

STEP 6: (Optional) Use Figma Plugin
─────────────────────────────────────────────────────────────────────────────
To automate this setup, create a Figma plugin using the "Development API"
with the structure provided in the JSON blueprint below.

STEP 7: Share & Collaborate
─────────────────────────────────────────────────────────────────────────────
Once created:
  1. Get the file key from the URL (fig.co/file/{FILE_KEY}/...)
  2. Share with team members
  3. Set up shared libraries for components

═════════════════════════════════════════════════════════════════════════════
`;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           Figma MVP Design System & Screens Setup Script                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    // Step 1: List existing files
    const files = await listProjectFiles();
    console.log(`✓ Found ${files.length} file(s) in project ${PROJECT_ID}\n`);

    // Display existing files
    if (files.length > 0) {
      console.log('Existing files:');
      files.forEach((file) => {
        console.log(`  • ${file.name} (${file.key})`);
      });
      console.log();
    }

    // Step 2: Check if Dreamer file exists
    const dreamerFile = findExistingFile(
      files,
      'Dreamer — MVP Design System & Screens'
    );

    if (dreamerFile) {
      console.log('✓ File "Dreamer — MVP Design System & Screens" already exists!');
      console.log(`  Key: ${dreamerFile.key}`);
      console.log(`  URL: https://www.figma.com/file/${dreamerFile.key}\n`);
    } else {
      console.log('✗ File "Dreamer — MVP Design System & Screens" does not exist.');
      console.log('  It needs to be created manually.\n');
    }

    // Step 3: Output setup instructions
    console.log(generateSetupInstructions());

    // Step 4: Output JSON blueprint
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                      DESIGN SYSTEM BLUEPRINT (JSON)                       ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(JSON.stringify(DESIGN_SYSTEM_BLUEPRINT, null, 2));
    console.log('\n');

    // Step 5: Provide additional context
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          NEXT STEPS                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    if (dreamerFile) {
      console.log(`✓ READY: Your design system file is at:`);
      console.log(`  https://www.figma.com/file/${dreamerFile.key}\n`);
      console.log('Next steps:');
      console.log('  1. Review the structure and create pages if not already done');
      console.log('  2. Add components and design tokens');
      console.log('  3. Create prototype flows');
      console.log('  4. Generate dev handoff specs\n');
    } else {
      console.log('✓ BLUEPRINT READY: Use the JSON above and setup guide to create your');
      console.log('  design system in Figma, or adapt it for your Figma plugin.\n');
      console.log('To automate this in the future:');
      console.log('  1. Create a Figma plugin using the Development API');
      console.log('  2. Use the JSON blueprint as your data model');
      console.log('  3. Call figma.createPage() and figma.createFrame()\n');
    }

    // Step 6: Environment info
    console.log('═════════════════════════════════════════════════════════════════════════════');
    console.log('Configuration:');
    console.log(`  Team ID: ${TEAM_ID}`);
    console.log(`  Project ID: ${PROJECT_ID}`);
    console.log(`  API Base: ${FIGMA_API_BASE}`);
    console.log('═════════════════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error(
      '  • Check that FIGMA_TOKEN environment variable is set correctly'
    );
    console.error('  • Verify your token has access to the project');
    console.error('  • Ensure you have API access enabled on your Figma account');
    process.exit(1);
  }
}

// Run the script
main();
