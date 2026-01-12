<h1 align="center"><a href="https://flowoss.com">Flow</a></h1>

<h2 align="center">Redefine ePub reader</h2>

<p align="center">Free. Open source. Browser-based.</p>

## Features

- Grid layout
- Search in book
- Image preview
- Custom typography
- Highlight and Annotation
- Theme
- Data export
- Cloud storage (Dropbox)

## Development

### Prerequisites

- [Node.js](https://nodejs.org) (v20+)
- [pnpm](https://pnpm.io/installation)
- [Git](https://git-scm.com/downloads)

### Clone the repo

```bash
git clone https://github.com/pacexy/flow
```

### Install dependencies

```bash
pnpm install
```

### Setup environment variables

Copy `.env.local.example` to `.env.local` and configure the required variables.

### Run the dev server

```bash
pnpm dev
```

The app will be available at `http://localhost:7127`.

### Other commands

```bash
pnpm build    # Production build
pnpm lint     # Run ESLint
pnpm start    # Start production server
```

## Self-hosting

### Docker

Using docker-compose:

```sh
docker compose up -d
```

Or build and run manually:

```sh
docker build -t flow .
docker run -p 3000:3000 --env-file .env.local flow
```

## Contributing

- [Submit bugs and feature requests](https://github.com/pacexy/flow/issues/new)
- [Submit pull requests](https://github.com/pacexy/flow/pulls)

## Credits

- [Epub.js](https://github.com/futurepress/epub.js/)
- [React](https://github.com/facebook/react)
- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org)
- [Vercel](https://vercel.com)
