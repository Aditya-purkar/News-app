#!/bin/bash
# setup-cluster.sh
# Full bootstrap script for the NewsEra kind cluster.
# Run from the ROOT of the News-app repo: bash setup-cluster.sh
# Prerequisites: kind, kubectl, helm

set -e

echo "========================================"
echo "  NewsEra — Cluster Bootstrap"
echo "========================================"

# ── STEP 1: Create the kind cluster ──────────────────────────────────────────
echo ""
echo "[1/6] Creating kind cluster..."

# Delete existing cluster if it already exists (safe to re-run)
if kind get clusters | grep -q "newsera-cluster"; then
  echo "      Found existing newsera-cluster — deleting it first..."
  kind delete cluster --name newsera-cluster
fi

kind create cluster --config k8s/cluster-config.yml --name newsera-cluster
echo "      Done."

# ── STEP 2: Install ingress-nginx on the control-plane node ──────────────────
# IMPORTANT: kind only port-maps the control-plane container (port 80 → 8080).
# Without pinning to control-plane, the ingress controller lands on a worker
# node and localhost:8080 never receives traffic (returns 000).
echo ""
echo "[2/6] Installing ingress-nginx (pinned to control-plane)..."

helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.nodeSelector."kubernetes\.io/hostname"=newsera-cluster-control-plane

echo "      Waiting for ingress-nginx controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
echo "      Done."

# ── STEP 3: Apply manifests in dependency order ───────────────────────────────
# Order matters: namespace first, then config/secrets, then stateful sets,
# then deployments, then ingress last.
echo ""
echo "[3/6] Applying k8s manifests..."

kubectl apply -f k8s/namespace.yml

# Apply secrets.yml which also contains the news-config ConfigMap.
# Then immediately patch MONGO_URL → MONGO_URI since the code reads MONGO_URI.
kubectl apply -f k8s/secrets.yml
kubectl patch configmap news-config -n newsera \
  --type=merge \
  -p '{"data":{"MONGO_URI":"mongodb://mongodb.newsera.svc.cluster.local:27017/newsera"}}'

kubectl apply -f k8s/mongodb.yml
kubectl apply -f k8s/auth-svc.yml
kubectl apply -f k8s/news-svc.yml
kubectl apply -f k8s/ai-svc.yml
kubectl apply -f k8s/api-gateway.yml
kubectl apply -f k8s/frontend.yml
kubectl apply -f k8s/ingress.yml
# NOTE: ingress-api.yml is intentionally NOT applied — it conflicts with
# ingress.yml and bypasses the API gateway. Delete it from the repo entirely.

echo "      Done."

# ── STEP 4: Set MONGO_URI per service (configmap key is MONGO_URL, code reads MONGO_URI)
# Until secrets.yml is updated in the repo, set it directly on each deployment.
echo ""
echo "[4/6] Setting MONGO_URI on auth-svc and news-svc..."

kubectl set env deployment/auth-svc -n newsera \
  MONGO_URI=mongodb://mongodb.newsera.svc.cluster.local:27017/newsera_auth

kubectl set env deployment/news-svc -n newsera \
  MONGO_URI=mongodb://mongodb.newsera.svc.cluster.local:27017/newsera_news

echo "      Done."

# ── STEP 5: Wait for all pods to be ready ────────────────────────────────────
echo ""
echo "[5/6] Waiting for all pods in newsera namespace (up to 3 min)..."
kubectl wait --namespace newsera \
  --for=condition=ready pod \
  --all \
  --timeout=180s
echo "      Done."

# ── STEP 6: Health check ─────────────────────────────────────────────────────
echo ""
echo "[6/6] Running health check..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
if [ "$HTTP_CODE" = "200" ]; then
  echo "      Frontend: OK (200)"
else
  echo "      Frontend: FAIL (got $HTTP_CODE — check ingress-nginx pod placement)"
fi

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/)
if [ "$API_CODE" = "200" ]; then
  echo "      API Gateway: OK (200)"
else
  echo "      API Gateway: FAIL (got $API_CODE)"
fi

echo ""
echo "========================================"
echo "  Cluster is ready!"
echo ""
echo "  App:         http://localhost:8080"
echo "  EC2 access:  http://<your-ec2-public-ip>:8080"
echo "               (ensure port 8080 is open in your security group)"
echo ""
echo "  Useful commands:"
echo "    kubectl get pods -n newsera"
echo "    kubectl get ingress -n newsera"
echo "    kubectl logs -n newsera deployment/api-gateway --tail=20"
echo "    kubectl logs -n newsera deployment/auth-svc --tail=20"
echo "========================================"