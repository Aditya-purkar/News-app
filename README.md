# NewsEra

NewsEra is a distributed, AI-powered news platform. It aggregates news from external providers, summarizes and explains stories using AI, and serves everything through a microservices backend with a React frontend.

## Architecture

The system is split into independently deployable services:

| Service       | Port | Responsibility                                              |
|----------------|------|--------------------------------------------------------------|
| `frontend`     | 5173 | React + Vite SPA — UI, search, article views, chat            |
| `api-gateway`  | 5000 | Single entry point; routes requests to backend services       |
| `auth-svc`     | 5001 | User registration, login, JWT-based auth                      |
| `news-svc`     | 5002 | Fetches/aggregates news from GNews and NewsData APIs          |
| `ai-svc`       | 5003 | AI summaries, "why it matters" explanations, chat (Gemini/OpenAI/xAI/OpenRouter) |
| `mongodb`      | 27017| Stores users (`newsera_auth`) and news data (`newsera_news`)  |
| `nginx`        | 80   | Reverse proxy in front of frontend + api-gateway (local/dev)  |

### Request flow

```
Browser
  └─> nginx / Ingress
        ├─> /api/*  -> api-gateway -> auth-svc / news-svc / ai-svc -> MongoDB
        └─> /*      -> frontend (React SPA)
```

`api-gateway` is the only service the frontend talks to directly. It forwards requests to `auth-svc`, `news-svc`, and `ai-svc` over the internal Docker/Kubernetes network.

### AI provider strategy

`ai-svc` supports multiple AI providers with a configurable fallback order (`AI_TEXT_PROVIDER_ORDER`): OpenAI, Gemini, xAI (Grok), and OpenRouter. If one provider fails or hits a cooldown, it falls back to the next.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Auth:** JWT (jsonwebtoken, bcryptjs)
- **AI:** Google Gemini, OpenAI, xAI, OpenRouter
- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes (via `kind` — Kubernetes in Docker)
- **CI/CD:** Jenkins (build, push to DockerHub, deploy to cluster)
- **GitOps:** ArgoCD (auto-syncs `k8s/` manifests to the cluster)
- **Infra:** Terraform (AWS EC2)

## Local development (Docker Compose)

Requires Docker and Docker Compose.

```bash
# Set required API keys
export GNEWS_API_KEY=your_key
export NEWSDATA_API_KEY=your_key
export GEMINI_API_KEY=your_key

docker compose up --build
```

Services started:
- MongoDB on `27017`
- `auth-svc`, `news-svc`, `ai-svc` on internal network
- `api-gateway` on `5000`
- `frontend` on `5173`
- `nginx` on `80` (proxies to frontend + api-gateway)

## Kubernetes deployment (kind cluster)

The `k8s/` directory contains manifests for all services:

- `namespace.yml` — creates the `newsera` namespace
- `mongodb.yml`, `auth-svc.yml`, `news-svc.yml`, `ai-svc.yml`, `api-gateway.yml`, `frontend.yml`
- `secrets.yml` — API keys and JWT secret (base64-encoded)
- `ingress.yml` — routes `/api/*` to `api-gateway`, everything else to `frontend`

### Bootstrap the cluster

```bash
bash setup-cluster.sh
```

This creates a 3-node `kind` cluster (1 control-plane + 2 workers) as defined in `cluster-config.yml`, installs the nginx ingress controller, and applies all manifests in `k8s/`.

### Port mappings (kind -> host)

| Host port | Purpose                       |
|-----------|-------------------------------|
| 8080      | App via nginx ingress (HTTP)  |
| 443       | HTTPS (ingress)                |
| 8085      | Extra NodePort (30005)         |
| 8086      | Extra NodePort (30000)         |
| 9090      | Monitoring NodePort (Prometheus/Grafana, 32000) |
| 6443      | Kubernetes API server          |

Once running, the app is available at `http://<server-ip>:8080`.

## CI/CD pipeline (Jenkins)

The `Jenkinsfile` defines a pipeline that:

1. Checks out the repo
2. Builds Docker images for each service
3. Pushes images to DockerHub
4. Deploys updated manifests to the `kind` cluster (via `kubectl`)

Jenkins runs on a separate EC2 instance and connects to the cluster EC2 over its private IP to run `kubectl` commands.

## GitOps (ArgoCD)

`argocd-app.yml` defines an ArgoCD `Application` that watches the `k8s/` path of this repo on the `main` branch and auto-syncs it to the `newsera` namespace, with automated pruning and self-healing enabled — manual `kubectl` changes get reverted to match git.

## Infrastructure (Terraform)

The `terraform/` directory provisions two EC2 instances on AWS:

- **Cluster host** — runs the `kind` Kubernetes cluster (Docker, kubectl, kind, helm)
- **Jenkins host** — runs Jenkins, Docker, and kubectl (for deploying to the cluster host)

```bash
cd terraform
terraform init
terraform apply -var="key_name=<your-keypair-name>"
```

Outputs include public/private IPs for both instances, SSH commands, and the app/Jenkins URLs.

## Environment variables / secrets

| Variable             | Used by    | Purpose                          |
|----------------------|------------|-----------------------------------|
| `GNEWS_API_KEY`      | news-svc   | GNews API access                  |
| `NEWSDATA_API_KEY`   | news-svc   | NewsData API access                |
| `GEMINI_API_KEY`     | ai-svc     | Google Gemini API access           |
| `OPENAI_API_KEY`     | ai-svc     | OpenAI API access (optional)       |
| `XAI_API_KEY`        | ai-svc     | xAI/Grok API access (optional)     |
| `OPENROUTER_API_KEY` | ai-svc     | OpenRouter API access (optional)   |
| `JWT_SECRET`         | auth-svc   | Signs/verifies auth tokens         |
| `MONGO_URI`          | all backend services | MongoDB connection string |

In Kubernetes, these are stored in `k8s/secrets.yml`. **Rotate any keys that were committed to this repo before making it public.**

## Project structure

```
News-app/
├── api-gateway/       # Express gateway, routes to backend services
├── backend/
│   ├── auth-svc/      # Auth: register, login, JWT
│   ├── news-svc/      # News aggregation (GNews, NewsData)
│   └── ai-svc/        # AI summaries, chat, multi-provider fallback
├── frontend/          # React + Vite SPA
├── nginx/             # Reverse proxy config (local dev)
├── k8s/               # Kubernetes manifests
├── terraform/         # AWS infra (cluster + Jenkins EC2)
├── argocd-app.yml     # ArgoCD GitOps application
├── cluster-config.yml # kind cluster topology
├── setup-cluster.sh   # Cluster bootstrap script
├── docker-compose.yml # Local dev stack
└── Jenkinsfile        # CI/CD pipeline
```
