import { test, expect } from '@playwright/test';
import { makeUser, loginAs, uniq } from './helpers';

test('criaStoryTexto', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar story' }).click();
  await page.getByLabel('Texto do story').fill('Bom dia ' + uniq());
  await page.getByRole('button', { name: 'Publicar story' }).click();
  await expect(page.getByRole('button', { name: 'Story de ' + u.handle })).toBeVisible();
});

test('storyViewerAvancaEFecha', async ({ page }) => {
  const b = await makeUser();
  await b.client.rpc('create_story', { p_media_path: null, p_bg: '#FF0A78', p_text: 'um' });
  await b.client.rpc('create_story', { p_media_path: null, p_bg: '#8A2BE2', p_text: 'dois' });
  const u = await makeUser(); await loginAs(page, u);
  await page.goto('/');
  const tile = page.getByRole('button', { name: 'Story de ' + b.handle });
  await expect(tile).toHaveAttribute('data-seen', 'false');
  await tile.click();
  const viewer = page.getByRole('dialog', { name: 'Story de ' + b.handle });
  await expect(viewer).toHaveAttribute('data-frame', '0');
  await expect(viewer).toContainText('um');
  await viewer.getByRole('button', { name: 'Próximo' }).click();
  await expect(viewer).toHaveAttribute('data-frame', '1');
  await viewer.getByRole('button', { name: 'Próximo' }).click();
  await expect(viewer).toBeHidden();
  await expect(tile).toHaveAttribute('data-seen', 'true');
});

test('videosTelaCheia', async ({ page }) => {
  const u = await makeUser(); await loginAs(page, u);
  const path = `${u.id}/${uniq()}.mp4`;
  const up = await u.client.storage.from('media').upload(path, Buffer.from('00000000', 'hex'), { contentType: 'video/mp4' });
  expect(up.error).toBeNull();
  await u.client.rpc('create_post', { p_type: 'video', p_text: 'Vídeo ' + uniq(), p_bg: null, p_media_path: path, p_sensitive: false });
  await page.goto('/videos');
  const reel = page.locator('.reel').first();
  await expect(reel).toBeVisible();
  const [rh, vh] = await page.evaluate(() => [document.querySelector('.reel')!.getBoundingClientRect().height, document.querySelector('main.view')!.clientHeight]);
  expect(Math.abs(rh - vh)).toBeLessThanOrEqual(2);
  await expect(reel.locator('video')).toHaveAttribute('src', /^http/);
});
