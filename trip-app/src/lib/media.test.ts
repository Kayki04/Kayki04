import { describe, it, expect } from 'vitest';
import { validateFile } from './media';

const MB = 1024 * 1024;
describe('validateFile', () => {
  it('aceita foto jpg até 15 MB', () => expect(validateFile({ size: 15 * MB, type: 'image/jpeg' }, 'photo')).toBeNull());
  it('recusa foto acima de 15 MB', () => expect(validateFile({ size: 15 * MB + 1, type: 'image/png' }, 'photo')).toBe('Foto até 15 MB (JPG, PNG ou WEBP).'));
  it('recusa gif como foto', () => expect(validateFile({ size: 10, type: 'image/gif' }, 'photo')).toBe('Foto até 15 MB (JPG, PNG ou WEBP).'));
  it('aceita vídeo mp4 até 200 MB', () => expect(validateFile({ size: 200 * MB, type: 'video/mp4' }, 'video')).toBeNull());
  it('aceita mov', () => expect(validateFile({ size: 10, type: 'video/quicktime' }, 'video')).toBeNull());
  it('recusa vídeo acima de 200 MB', () => expect(validateFile({ size: 200 * MB + 1, type: 'video/mp4' }, 'video')).toBe('Vídeo até 200 MB (MP4, WEBM ou MOV).'));
  it('recusa foto no lugar de vídeo', () => expect(validateFile({ size: 10, type: 'image/jpeg' }, 'video')).toBe('Vídeo até 200 MB (MP4, WEBM ou MOV).'));
});
