# JSON ⇄ Readable Script Editor

A web application for editing JSON scripts in a human-readable format. This tool extracts the `script` string from JSON objects into a separate editor pane for easy editing and visualization, then syncs changes back to the JSON format.

## Features

- **Dual-pane editor**: JSON on the left, readable script on the right
- **Smart escaping/unescaping**: Automatically converts `\n` sequences to real newlines for editing
- **Format JSON**: Pretty-print JSON with proper indentation
- **Copy functionality**: Copy JSON or script content to clipboard
- **Responsive design**: Works on desktop and mobile devices
- **Dark theme**: Easy on the eyes for long editing sessions

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd human-readable-json-scripts
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`.

### Building for Production

Build the application:
```bash
npm run build
```

The built files will be in the `dist/` directory.

Preview the production build:
```bash
npm run preview
```

## Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setup Instructions:

1. **Push to GitHub**: Make sure your code is pushed to a GitHub repository
2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "GitHub Actions"
3. **Automatic Deployment**: The app will automatically build and deploy when you push to the `main` branch

### Manual Deployment:

If you prefer to deploy manually:

1. Build the project:
```bash
npm run build
```

2. The `dist/` folder contains the built application
3. You can upload the contents of `dist/` to any static hosting service

### Live Demo

Once deployed, your app will be available at:
`https://yourusername.github.io/human-readable-json-scripts/`

## Usage

1. **Load JSON**: Paste your JSON containing a `script` field into the left editor
2. **Extract Script**: Click "Load →" to extract the script into the right editor
3. **Edit**: Make changes to the script in the right editor (with proper syntax highlighting and newlines)
4. **Apply Changes**: Click "← Apply edits to JSON" to update the JSON with your changes
5. **Format**: Use "Format JSON" to pretty-print the JSON
6. **Copy**: Use the copy buttons to copy either the JSON or script to clipboard

## Example

The application works with JSON objects like this:

```json
{
  "script": "const createSystemPrompt = () => {\n  const header = `# AI asistentka Romana (O2)\\n\\n## Základní nastavení\\n- **Jméno**: Romana` ;\n  return header;\n};\n\nconst systemPromptTemplate = createSystemPrompt();\nreturn { success: true };",
  "timeout": 5000,
  "enableConsole": true
}
```

## Technology Stack

- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **CSS**: Custom styling with CSS variables
- **HTML5**: Modern semantic markup

## License

MIT License - see [LICENSE](LICENSE) file for details.
