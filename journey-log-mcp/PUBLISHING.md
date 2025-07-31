# Publishing Journey Log MCP Server to NPM

This guide explains how to publish the Journey Log MCP server package to NPM.

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **Organization**: Create the `@journey-log` organization on NPM (or adjust package name)
3. **Node.js**: Ensure Node.js 18+ is installed

## Publishing Steps

### 1. Initial Setup

```bash
cd journey-log-mcp

# Login to NPM
npm login

# Verify you're logged in
npm whoami
```

### 2. Test Locally

```bash
# Install dependencies
npm install

# Test the server protocol
node test-server.js

# Link for local testing
npm link

# Test the executable
JOURNEY_LOG_API_KEY=test journey-log-mcp
```

### 3. Pre-publish Checklist

- [ ] Update version in `package.json`
- [ ] Update README if needed
- [ ] Test with actual API key
- [ ] Commit all changes
- [ ] Tag the release

### 4. Publish to NPM

```bash
# Dry run to see what will be published
npm publish --dry-run

# Publish to NPM
npm publish --access public
```

### 5. Verify Publication

```bash
# Check if package is available
npm view @journey-log/mcp-server

# Test installation
npm install -g @journey-log/mcp-server

# Verify executable works
journey-log-mcp --version
```

## Version Management

Follow semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

```bash
# Bump version
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
```

## GitHub Release

After publishing to NPM:

1. Push tags: `git push --tags`
2. Create GitHub release with changelog
3. Update Journey Log documentation

## Troubleshooting

### "Permission denied" error
- Ensure you're logged in: `npm login`
- Check organization membership
- Use `--access public` for scoped packages

### "Package name too similar"
- Use scoped package: `@journey-log/mcp-server`
- Choose unique name

### Installation fails globally
- Check Node.js version (18+)
- Try with sudo/admin: `sudo npm install -g @journey-log/mcp-server`

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Monitor Usage
- Check download stats: `npm view @journey-log/mcp-server`
- Monitor GitHub issues
- Respond to user feedback

## Emergency Procedures

### Unpublish (within 24 hours)
```bash
npm unpublish @journey-log/mcp-server@1.0.0
```

### Deprecate Version
```bash
npm deprecate @journey-log/mcp-server@1.0.0 "Critical bug, please update"
```

## Contact

- NPM Support: support@npmjs.com
- Journey Log Team: dev@devlog.design