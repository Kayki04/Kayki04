import { test, expect } from '@playwright/test';
import { makeUser, loginAs } from './helpers';

test('ageGate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Você tem 18 anos ou mais?')).toBeVisible();
  await page.getByRole('button', { name: 'Tenho 18 anos ou mais' }).click();
  await expect(page.getByText('Você tem 18 anos ou mais?')).toBeHidden();
  await page.reload();
  await expect(page.getByText('Você tem 18 anos ou mais?')).toBeHidden();
});

test('navBase', async ({ page }) => {
  await loginAs(page, await makeUser());
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  for (const label of ['Início', 'Vídeos', 'Postar', 'Assinaturas', 'Perfil'])
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
});
