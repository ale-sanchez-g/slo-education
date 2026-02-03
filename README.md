# SLO Education Hub

A central hub for teams to join the SLO education journey with pages and agents to support your learning.

## 🌐 Live Site

The landing page is deployed via GitHub Pages and available at: `https://ale-sanchez-g.github.io/slo-education/`

## 📋 About

This repository hosts a landing page for the SLO (Service Level Objectives) Education Hub. The site provides:

- Introduction to SLOs and their importance
- Educational resources for teams learning about SLOs
- Guidance on getting started with SLO implementation
- Links to documentation, community, and tools

## 🚀 Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions whenever changes are pushed to the `main` branch. The deployment workflow can also be triggered manually from the Actions tab.

### Deployment Workflow

The `.github/workflows/deploy.yml` workflow:
1. Checks out the repository
2. Configures GitHub Pages
3. Uploads the site content as an artifact
4. Deploys to GitHub Pages

## 🛠️ Local Development

To test the landing page locally:

```bash
# Start a local web server
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## 📁 Site Structure

- `index.html` - Main landing page
- `styles.css` - Styling for the landing page
- `.github/workflows/deploy.yml` - GitHub Actions deployment workflow

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
