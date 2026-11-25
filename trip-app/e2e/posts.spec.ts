import { test, expect } from '@playwright/test';
import { makeUser, loginAs, uniq } from './helpers';

// PNG 1x1 válido
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('publicaTexto', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const txt = 'Texto ' + uniq();
  await page.goto('/novo');
  await page.getByRole('button', { name: 'Texto', exact: true }).click();
  await page.getByLabel('Texto', { exact: true }).fill(txt);
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page).toHaveURL('http://localhost:5180/');
  await expect(page.locator('article.post', { hasText: txt })).toBeVisible();
});

test('publicaFoto', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const leg = 'Legenda ' + uniq();
  await page.goto('/novo');
  await page.getByLabel('Escolher foto').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('.preview img')).toBeVisible();
  await page.getByLabel('Legenda').fill(leg);
  await page.getByRole('button', { name: 'Publicar' }).click();
  const post = page.locator('article.post', { hasText: leg });
  await expect(post).toBeVisible();
  await expect(post.locator('.midia img')).toHaveAttribute('src', /^http/);
});

test('arquivoInvalido', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/novo');
  await page.getByLabel('Escolher foto').setInputFiles({ name: 'a.gif', mimeType: 'image/gif', buffer: PNG });
  await expect(page.getByText('Foto até 15 MB (JPG, PNG ou WEBP).')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publicar' })).toBeDisabled();
});

test('curtir', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const txt = 'Curtir ' + uniq();
  await u.client.rpc('create_post', { p_type: 'text', p_text: txt, p_bg: '#8A2BE2', p_media_path: null, p_sensitive: false });
  await page.goto('/');
  const like = page.locator('article.post', { hasText: txt }).getByRole('button', { name: 'Curtir' });
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toContainText('1');
  await page.reload();
  await expect(page.locator('article.post', { hasText: txt }).getByRole('button', { name: 'Curtir' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('article.post', { hasText: txt }).getByRole('button', { name: 'Curtir' }).click();
  await expect(page.locator('article.post', { hasText: txt }).getByRole('button', { name: 'Curtir' })).toContainText('0');
});

test('sensivelBorrado', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const txt = 'Sensivel ' + uniq();
  await u.client.rpc('create_post', { p_type: 'text', p_text: txt, p_bg: null, p_media_path: null, p_sensitive: true });
  await page.goto('/');
  const post = page.locator('article.post').filter({ has: page.locator(`text=${txt}`) });
  await expect(post.locator('.blur')).toHaveCount(1);
  await post.getByRole('button', { name: 'Toque para ver' }).click();
  await expect(post.locator('.blur')).toHaveCount(0);
});

test('postBloqueado', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/novo');
  await page.getByRole('button', { name: 'Texto', exact: true }).click();
  await page.getByLabel('Texto', { exact: true }).fill('eu tenho 15 anos');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByRole('alert')).toContainText('Perfil em revisão');
});
