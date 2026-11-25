import { describe, it, expect } from 'vitest';
import { blockedTerm } from './moderation';

describe('blockedTerm', () => {
  it.each(['CRIANÇA', 'menor de idade', 'Menor De Idade', 'tenho 15 anos', 'ela tem 12 anos', 'garota de 16 anos', 'com 14 anos', 'novinha', 'pedofilia'])('bloqueia %s', t => {
    expect(blockedTerm('olha isso ' + t + ' hoje')).not.toBeNull();
  });
  it.each(['18 anos de carreira', 'comemorando 25 anos', '10 anos de carreira', 'Moro aqui há 3 anos', 'Torpedo de chocolate', '3 anos de canal', 'depois de 2 anos de namoro'])('libera %s', t => {
    expect(blockedTerm(t)).toBeNull();
  });
});
