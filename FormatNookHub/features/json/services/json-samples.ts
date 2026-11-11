export interface JsonSample {
  id: string;
  name: string;
  description: string;
  data: string;
}

export const JSON_SAMPLES: JsonSample[] = [
  {
    id: 'user-profile',
    name: 'User Profile (Demonstration)',
    description: 'Standard nested user profile with skills and settings',
    data: JSON.stringify(
      {
        id: 'usr_98231',
        name: 'Alex Mercer',
        email: 'alex.mercer@example.com',
        role: 'Staff Engineer',
        verified: true,
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        preferences: {
          theme: 'dark',
          notifications: { email: true, push: false, slack: true },
          locale: 'en-US'
        }
      },
      null,
      2
    )
  },
  {
    id: 'ecommerce-order',
    name: 'E-Commerce Order (Demonstration)',
    description: 'Order details with customer, items array, and payment',
    data: JSON.stringify(
      {
        orderId: 'ORD-2026-9041',
        customer: {
          id: 'cust_401',
          name: 'Sarah Connor',
          email: 's.connor@example.org'
        },
        items: [
          { sku: 'TECH-881', title: 'Mechanical Keyboard (Cherry Brown)', quantity: 1, price: 129.99 },
          { sku: 'ACC-012', title: 'USB-C Braided Cable 2m', quantity: 2, price: 14.5 }
        ],
        subtotal: 158.99,
        tax: 12.72,
        total: 171.71,
        status: 'shipped',
        trackingNumber: 'TRK-98127391'
      },
      null,
      2
    )
  },
  {
    id: 'users-array',
    name: 'Employees Table (Array) (Demonstration)',
    description: 'Array of tabular objects suitable for Table View',
    data: JSON.stringify(
      [
        { id: 1, name: 'Alice Cooper', department: 'Engineering', active: true, salary: 115000 },
        { id: 2, name: 'Bob Dylan', department: 'Product Design', active: true, salary: 98000 },
        { id: 3, name: 'Carol Danvers', department: 'DevOps', active: false, salary: 125000 },
        { id: 4, name: 'David Bowie', department: 'Marketing', active: true, salary: 89000 },
        { id: 5, name: 'Eva Green', department: 'Engineering', active: true, salary: 130000 }
      ],
      null,
      2
    )
  },
  {
    id: 'api-response',
    name: 'REST API Response (Demonstration)',
    description: 'Paginated API response with status, metadata, and items',
    data: JSON.stringify(
      {
        status: 'success',
        code: 200,
        pagination: {
          page: 1,
          perPage: 25,
          totalRecords: 120,
          totalPages: 5
        },
        data: [
          { id: 'prod_001', name: 'Cloud Monitor Agent', category: 'Infrastructure', price: 49.0 },
          { id: 'prod_002', name: 'Log Ingestion Pipeline', category: 'Data', price: 99.0 },
          { id: 'prod_003', name: 'Security Audit Scanner', category: 'Security', price: 149.0 }
        ],
        meta: {
          responseTimeMs: 42,
          serverRegion: 'us-east-1',
          cached: true
        }
      },
      null,
      2
    )
  },
  {
    id: 'nested-config',
    name: 'Deep Nested Config (Demonstration)',
    description: 'Multi-level application and cluster configuration tree',
    data: JSON.stringify(
      {
        environment: 'production',
        cluster: {
          zone: 'us-west-2a',
          nodes: {
            min: 3,
            max: 12,
            autoscaling: {
              enabled: true,
              metrics: {
                cpuThreshold: 75,
                memoryThreshold: 80,
                cooldownPeriodSeconds: 300
              }
            }
          }
        },
        services: {
          gateway: {
            rateLimit: { requestsPerMinute: 6000, burst: 100 },
            ssl: { enforce: true, minVersion: 'TLSv1.3' }
          }
        }
      },
      null,
      2
    )
  },
  {
    id: 'geojson-feature',
    name: 'GeoJSON FeatureCollection (Demonstration)',
    description: 'Geographic spatial points and properties',
    data: JSON.stringify(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-122.4194, 37.7749] },
            properties: { title: 'San Francisco Office', city: 'San Francisco', capacity: 120 }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-0.1278, 51.5074] },
            properties: { title: 'London HQ', city: 'London', capacity: 250 }
          }
        ]
      },
      null,
      2
    )
  },
  {
    id: 'dirty-json',
    name: 'Broken JSON (For Auto Repair Demonstration)',
    description: 'JSON with trailing commas, single quotes, unquoted keys, and comments',
    data: `{\n  // User record with syntax errors\n  name: 'John Doe',\n  'role': 'Developer',\n  age: 32,\n  skills: [\n    'TypeScript',\n    'Next.js',\n  ],\n  address: {\n    city: 'Seattle',\n    zip: '98101',\n  },\n}`
  }
];
