import { http, HttpResponse, delay } from 'msw';
import { mockObrasList, mockUser, mockObra, mockKpis } from './fixtures.js';

const API_BASE = '/api';

export const handlers = [
  // GET /api/obras - with optional filters
  http.get(`${API_BASE}/obras`, async ({ request }) => {
    const url = new URL(request.url);
    const municipio = url.searchParams.get('municipio');
    const referente = url.searchParams.get('referente');
    
    // Filter mocks based on query params
    let data = mockObrasList.data;
    if (municipio) {
      data = data.filter(obra => obra.municipio === municipio);
    }
    if (referente) {
      data = data.filter(obra => obra.referente === referente);
    }
    
    await delay(100); // Simulate network delay
    
    return HttpResponse.json({
      data,
      pagination: {
        page: 1,
        limit: 10,
        total: data.length,
        totalPages: 1
      }
    });
  }),

  // GET /api/obras/kpis
  http.get(`${API_BASE}/obras/kpis`, async () => {
    await delay(100);
    return HttpResponse.json(mockKpis);
  }),

  // GET /api/obras/:id
  http.get(`${API_BASE}/obras/:id`, async ({ params }) => {
    const { id } = params;
    
    if (id === '1') {
      await delay(100);
      return HttpResponse.json(mockObra);
    }
    
    // Simulate 404 for unknown IDs
    return new HttpResponse(null, { status: 404 });
  }),

  // POST /api/obras
  http.post(`${API_BASE}/obras`, async () => {
    await delay(100);
    // Return a new obra with incremented ID
    return HttpResponse.json({
      ...mockObra,
      id: 100
    }, { status: 201 });
  }),

  // PUT /api/obras/:id
  http.put(`${API_BASE}/obras/:id`, async ({ params }) => {
    const { id } = params;
    
    if (id === '1') {
      await delay(100);
      return HttpResponse.json(mockObra);
    }
    
    return new HttpResponse(null, { status: 404 });
  }),

  // DELETE /api/obras/:id
  http.delete(`${API_BASE}/obras/:id`, async ({ params }) => {
    const { id } = params;
    
    if (id === '1') {
      await delay(100);
      return new HttpResponse(null, { status: 204 });
    }
    
    return new HttpResponse(null, { status: 404 });
  }),

  // POST /api/auth/login
  http.post(`${API_BASE}/auth/login`, async () => {
    await delay(100);
    // Login returns 200/204 with no body on success
    return new HttpResponse(null, { status: 200 });
  }),

  // GET /api/auth/me
  http.get(`${API_BASE}/auth/me`, async () => {
    await delay(100);
    return HttpResponse.json(mockUser);
  }),

  // POST /api/auth/logout
  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(100);
    return new HttpResponse(null, { status: 200 });
  })
];
