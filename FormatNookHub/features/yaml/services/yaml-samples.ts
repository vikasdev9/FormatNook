export interface YamlSampleItem {
  id: string;
  name: string;
  category: 'Kubernetes' | 'Docker' | 'CI/CD' | 'Ansible' | 'General';
  description: string;
  data: string;
}

export const YAML_SAMPLES: YamlSampleItem[] = [
  {
    id: 'k8s-multi',
    name: 'Kubernetes Multi-Resource Stream',
    category: 'Kubernetes',
    description: 'Deployment, Service, and ConfigMap stream separated by ---',
    data: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-api-deployment
  labels:
    app: web-api
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: web-api
          image: formatnook/api:v2.4.0
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: web-api-config
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: web-api-service
  labels:
    app: web-api
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
      name: http
  selector:
    app: web-api
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-api-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "1000"`,
  },
  {
    id: 'k8s-deployment',
    name: 'Kubernetes Deployment',
    category: 'Kubernetes',
    description: 'Production deployment with rolling update strategy and probes',
    data: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  namespace: production
  labels:
    app.kubernetes.io/name: payment-service
    app.kubernetes.io/version: "1.2.0"
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
        - name: payment-api
          image: ghcr.io/company/payment-api:1.2.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8000
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /livez
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 20`,
  },
  {
    id: 'k8s-service',
    name: 'Kubernetes Service (LoadBalancer)',
    category: 'Kubernetes',
    description: 'Cloud LoadBalancer Service exposing HTTP and HTTPS ports',
    data: `apiVersion: v1
kind: Service
metadata:
  name: frontend-lb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  selector:
    app: frontend-ui
  ports:
    - name: http
      port: 80
      targetPort: 3000
    - name: https
      port: 443
      targetPort: 3000`,
  },
  {
    id: 'k8s-ingress',
    name: 'Kubernetes Ingress (TLS)',
    category: 'Kubernetes',
    description: 'NGINX Ingress Controller route with TLS certificate',
    data: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: formatnook-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - formatnook.com
      secretName: formatnook-tls
  rules:
    - host: formatnook.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80`,
  },
  {
    id: 'k8s-secret',
    name: 'Kubernetes Secret',
    category: 'Kubernetes',
    description: 'Opaque Secret with stringData for secure environment values',
    data: `apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
  namespace: production
type: Opaque
stringData:
  DB_HOST: "postgres.internal.net"
  DB_PORT: "5432"
  DB_USER: "dbadmin"
  DB_PASSWORD: "SuperSecretPassword123!"`,
  },
  {
    id: 'k8s-statefulset',
    name: 'Kubernetes StatefulSet',
    category: 'Kubernetes',
    description: 'StatefulSet for database storage with volumeClaimTemplates',
    data: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-headless
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7.2-alpine
          ports:
            - containerPort: 6379
              name: redis
          volumeMounts:
            - name: redis-data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi`,
  },
  {
    id: 'docker-compose',
    name: 'Docker Compose Stack',
    category: 'Docker',
    description: 'Full multi-container stack with API, Postgres, Redis, and volumes',
    data: `version: "3.9"

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: formatnook-web
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://user:secret@postgres:5432/app_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - app-net

  postgres:
    image: postgres:16-alpine
    container_name: formatnook-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - app-net

  redis:
    image: redis:7-alpine
    container_name: formatnook-cache
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - app-net

networks:
  app-net:
    driver: bridge

volumes:
  pgdata:
    driver: local`,
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions CI/CD Pipeline',
    category: 'CI/CD',
    description: 'Automated test, lint, and build workflow with Node.js matrix',
    data: `name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Run Unit & Integration Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check TypeScript types
        run: npx tsc --noEmit

      - name: Run test suite
        run: npm test -- --coverage

  build:
    name: Build Next.js Production Bundle
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run build`,
  },
  {
    id: 'ansible-playbook',
    name: 'Ansible Web Provisioning Playbook',
    category: 'Ansible',
    description: 'Server configuration playbook for Nginx and system security',
    data: `- name: Provision Production Web Servers
  hosts: webservers
  become: true
  vars:
    http_port: 80
    max_clients: 200
    nginx_user: www-data

  tasks:
    - name: Update apt cache and install Nginx
      apt:
        name:
          - nginx
          - ufw
        state: latest
        update_cache: yes

    - name: Ensure Nginx service is running and enabled
      service:
        name: nginx
        state: started
        enabled: yes

    - name: Configure firewall rules for HTTP/HTTPS
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - 80
        - 443`,
  },
];

