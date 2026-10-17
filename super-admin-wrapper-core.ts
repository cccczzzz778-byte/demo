const REGION_USER_MUTATION=/^\/api\/v1\/region\/users(?:\/[^/]+\/reset)?$/;
const LEGACY_ADMIN_USERS=/^\/api\/v1\/admin\/users(?:\/[^/]+\/(?:reset|status))?$/;
const MUTATING=new Set(['POST','PUT','PATCH','DELETE']);

export function isAdminManagedRequest(request: Request): boolean {
  const path=new URL(request.url).pathname;
  const method=request.method.toUpperCase();
  if(path.startsWith('/api/control/')) return true;
  if(LEGACY_ADMIN_USERS.test(path)) return true;
  if(MUTATING.has(method)&&REGION_USER_MUTATION.test(path)) return true;
  return false;
}

export async function createSecurityGateRequest(request: Request): Promise<Request> {
  const url=new URL('/api/admin/users/__rbac_security_gate__',request.url);
  const headers=new Headers(request.headers);
  headers.delete('content-length');
  const method=request.method.toUpperCase();
  let body: ArrayBuffer|undefined;
  if(method!=='GET'&&method!=='HEAD') body=await request.clone().arrayBuffer();
  return new Request(url,{
    method,
    headers,
    body,
    redirect:request.redirect,
    signal:request.signal,
  });
}

const SECURITY_HEADERS=[
  'strict-transport-security','content-security-policy','x-frame-options','x-content-type-options',
  'referrer-policy','permissions-policy','cross-origin-opener-policy','cross-origin-resource-policy',
] as const;

export function withSecurityHeaders(response: Response, gate: Response): Response {
  const headers=new Headers(response.headers);
  for(const name of SECURITY_HEADERS){const value=gate.headers.get(name);if(value)headers.set(name,value)}
  headers.delete('content-length');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
