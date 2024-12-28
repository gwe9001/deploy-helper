# deploy-helper

## Installation

1. Clone the repository:

```bash
git clone https://github.com/gwe9001/deploy-helper.git
cd deploy-helper
```

2. Install dependencies:

```bash
npm install
```

### Development

Run the application in development mode:

```bash
npm run start
```

This will start the Electron application using electron-forge.

### Building

Package the application:

```bash
npm run package
```

Create distributable formats:

```bash
npm run make
```

### Publishing a New Release

1. Update the version in `package.json`:

```json
{
  "version": "1.0.13"
}
```

2. Create and push a new tag:

```bash
git tag v1.0.13
git push origin v1.0.13
```

This will trigger the GitHub Actions workflow to automatically build and publish the new release.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
