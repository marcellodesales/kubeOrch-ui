# KubeOrchestra

A visual Kubernetes workflow orchestrator that transforms complex YAML configurations into intuitive drag-and-drop interfaces.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Styling**: Tailwind CSS v4
- **Code Quality**: ESLint + Prettier
- **Development**: Turbopack for fast builds

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/KubeOrchestra/ui.git
cd ui

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎯 Available Scripts

```bash
npm run dev          # Start development server (port 3001)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 🌐 Development

- **Local**: http://localhost:3001
- **Network**: Available on your local network

## 📁 Project Structure

```
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # Reusable components
│   └── ui/            # shadcn/ui components
├── lib/               # Utility functions
└── public/            # Static assets
```

## 🎨 UI Components

Built with shadcn/ui components:

- Button (multiple variants)
- Card (with all sub-components)
- More components can be added as needed

## 🔧 Configuration Files

- `.prettierrc` - Prettier formatting rules
- `.eslintrc` - ESLint configuration
- `components.json` - shadcn/ui configuration
- `tailwind.config.js` - Tailwind CSS configuration

## 📝 Code Quality

- **ESLint**: TypeScript and React best practices
- **Prettier**: Consistent code formatting
- **TypeScript**: Full type safety
- **VS Code**: Auto-formatting on save

## 🚀 Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the Kubernetes community
