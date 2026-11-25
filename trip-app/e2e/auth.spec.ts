import { test, expect } from '@playwright/test';
import { makeUser, loginAs, createInvite, skipAgeGate, lastEmailCode, uniq } from './helpers';

test('semPerfilVaiProConvite', async ({ page }) => {
  const u = await makeUser({ profile: false });
  await loginAs(page, u);
  await page.goto('/');
  await expect(page).toHaveURL(/\/convite/);
  await expect(page.getByLabel('Código do convite')).toBeVisible();
});

test('conviteValidoCriaPerfil', async ({ page }) => {
  const u = await makeUser({ profile: false });
  const code = await createInvite('creator');
  await loginAs(page, u);
  await page.goto('/convite');
  await page.getByLabel('Código do convite').fill(code);
  await page.getByLabel('Seu @').fill(uniq('nova').slice(0, 20));
  await page.getByLabel('Seu nome').fill('Nova Criadora');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page).toHaveURL('http://localhost:5180/');
  await expect(page.locator('.cab .logo')).toBeVisible();
});

test('conviteInvalidoMostraErro', async ({ page }) => {
  const u = await makeUser({ profile: false });
  await loginAs(page, u);
  await page.goto('/convite');
  await page.getByLabel('Código do convite').fill('NAOEXISTE');
  await page.getByLabel('Seu @').fill(uniq('x').slice(0, 20));
  await page.getByLabel('Seu nome').fill('Alguém');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByText('Convite não encontrado. Confira o código.')).toBeVisible();
});

test('conviteEsgotadoMostraErro', async ({ page }) => {
  const code = await createInvite('fan', { maxUses: 1 });
  const a = await makeUser({ profile: false });
  await a.client.rpc('redeem_invite', { p_code: code, p_handle: uniq('a').slice(0, 20), p_name: 'A' });
  const u = await makeUser({ profile: false });
  await loginAs(page, u);
  await page.goto('/convite?c=' + code);
  await expect(page.getByLabel('Código do convite')).toHaveValue(code);
  await page.getByLabel('Seu @').fill(uniq('b').slice(0, 20));
  await page.getByLabel('Seu nome').fill('B');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByText('Este convite já foi usado.')).toBeVisible();
});

test('loginPorCodigoDeEmail', async ({ page }) => {
  await skipAgeGate(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/entrar/);
  const email = `${uniq()}@e2e.trip`;
  await page.getByLabel('Seu e-mail').fill(email);
  await page.getByRole('button', { name: 'Receber código' }).click();
  await expect(page.getByLabel('Código de 6 números')).toBeVisible();
  await page.getByLabel('Código de 6 números').fill(await lastEmailCode(email));
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/convite/);
});
