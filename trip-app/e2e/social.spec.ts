import { test, expect } from '@playwright/test';
import { makeUser, loginAs, uniq } from './helpers';

const post = async (u: Awaited<ReturnType<typeof makeUser>>, text: string) =>
  u.client.rpc('create_post', { p_type: 'text', p_text: text, p_bg: '#8A2BE2', p_media_path: null, p_sensitive: false });

test('comentar', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const txt = 'Post ' + uniq(); await post(u, txt);
  await page.goto('/');
  const card = page.locator('article.post', { hasText: txt });
  await card.getByRole('button', { name: 'Comentários' }).click();
  await page.getByLabel('Comentário', { exact: true }).fill('Que post bom');
  await page.getByRole('button', { name: 'Enviar comentário' }).click();
  await expect(page.locator('.comment', { hasText: 'Que post bom' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(card.getByRole('button', { name: 'Comentários' })).toContainText('1');
});

test('comentarioProibido', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const txt = 'Post ' + uniq(); await post(u, txt);
  await page.goto('/');
  await page.locator('article.post', { hasText: txt }).getByRole('button', { name: 'Comentários' }).click();
  await page.getByLabel('Comentário', { exact: true }).fill('cadê a novinha');
  await page.getByRole('button', { name: 'Enviar comentário' }).click();
  await expect(page.getByRole('alert')).toContainText('proibido');
  await expect(page.locator('.comment', { hasText: 'novinha' })).toHaveCount(0);
});

test('seguirPersiste', async ({ page }) => {
  const b = await makeUser({ name: 'Bia Teste' }); const txt = 'Da Bia ' + uniq(); await post(b, txt);
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/u/' + b.handle);
  await page.getByRole('button', { name: 'Seguir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Seguindo' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Seguindo' })).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: 'Seguindo' }).click();
  await expect(page.locator('article.post', { hasText: txt })).toBeVisible();
  await expect(page.locator('article.post')).toHaveCount(1);
});

test('denunciarEsconde', async ({ page }) => {
  const b = await makeUser(); const txt = 'Denuncia ' + uniq(); await post(b, txt);
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/');
  await page.locator('article.post', { hasText: txt }).getByRole('button', { name: 'Mais opções' }).click();
  await page.getByRole('button', { name: 'Denunciar' }).click();
  await page.getByRole('button', { name: /Envolve menor de idade/ }).click();
  await page.getByRole('button', { name: 'Enviar denúncia' }).click();
  await expect(page.getByText('Recebemos. O post foi ocultado enquanto analisamos.')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.locator('article.post', { hasText: txt })).toHaveCount(0);
});

test('perfilMostraGrade', async ({ page }) => {
  const b = await makeUser({ name: 'Grade Teste' }); await post(b, 'um ' + uniq()); await post(b, 'dois ' + uniq());
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/u/' + b.handle);
  await expect(page.getByRole('heading', { name: 'Grade Teste' })).toBeVisible();
  await expect(page.locator('.grade .thumb')).toHaveCount(2);
});

test('editarPerfil', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await page.getByLabel('Nome').fill('Nome Novo');
  await page.getByLabel('Bio').fill('Minha bio nova');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('heading', { name: 'Nome Novo' })).toBeVisible();
  await expect(page.getByText('Minha bio nova')).toBeVisible();
});

test('excluirConta', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Excluir conta' }).click();
  const confirm = page.getByRole('button', { name: 'Excluir para sempre' });
  await expect(confirm).toBeDisabled();
  await page.getByLabel('Digite seu @ para confirmar').fill(u.handle!);
  await confirm.click();
  await expect(page).toHaveURL(/\/entrar/);
});

test('adultoDesabilitado', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/perfil');
  const chave = page.getByLabel('Mostrar conteúdo adulto (+18)');
  await expect(chave).toBeVisible();
  await expect(chave).toBeDisabled();
  await expect(page.getByText('Disponível na próxima etapa da Trip.')).toBeVisible();
});

test('excluirContaApagaArquivos', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const path = `${u.id}/${crypto.randomUUID()}.png`;
  const up = await u.client.storage.from('media').upload(path, Buffer.from('89504e47', 'hex'), { contentType: 'image/png' });
  expect(up.error).toBeNull();
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Excluir conta' }).click();
  await page.getByLabel('Digite seu @ para confirmar').fill(u.handle!);
  await page.getByRole('button', { name: 'Excluir para sempre' }).click();
  await expect(page).toHaveURL(/\/entrar/);
  const { admin } = await import('./helpers');
  const { data } = await admin.storage.from('media').list(u.id);
  expect(data ?? []).toHaveLength(0);
});

test('excluirPostApagaArquivo', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const path = `${u.id}/${crypto.randomUUID()}.png`;
  await u.client.storage.from('media').upload(path, Buffer.from('89504e47', 'hex'), { contentType: 'image/png' });
  const leg = 'Apagar ' + uniq();
  await u.client.rpc('create_post', { p_type: 'photo', p_text: leg, p_bg: null, p_media_path: path, p_sensitive: false });
  await page.goto('/');
  await page.locator('article.post', { hasText: leg }).getByRole('button', { name: 'Mais opções' }).click();
  await page.getByRole('button', { name: 'Excluir post' }).click();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.locator('article.post', { hasText: leg })).toHaveCount(0);
  const { admin } = await import('./helpers');
  const { data } = await admin.storage.from('media').list(u.id);
  expect(data ?? []).toHaveLength(0);
});
