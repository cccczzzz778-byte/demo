import { expect, test } from 'bun:test';

const workflowPath = '.github/workflows/production-security.yml';

test('production security workflow runs full and focused security tests without dumping env', async () => {
  const file = Bun.file(workflowPath);
  expect(await file.exists()).toBe(true);
  const workflow = await file.text();

  expect(workflow).toContain('bun test');
  expect(workflow).toContain('tests/rbac-store.test.ts');
  expect(workflow).toContain('tests/admin-monitor-store.test.ts');
  expect(workflow).toContain('tests/super-admin-api.test.ts');
  expect(workflow).not.toMatch(/\b(?:printenv|env\s*$|set\s+-x)\b/m);
});
