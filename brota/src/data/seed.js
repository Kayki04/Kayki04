// Dados de exemplo do Rio de Janeiro — gravados no banco na primeira vez que o app abre.
const u = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
const face = (g, n) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
const H = 3600 * 1000;

export const SEED_ROLES = [
  {
    id: 'baile-da-lapa', nome: 'Baile da Lapa', bairro: 'Lapa', zona: 'Centro',
    endereco: 'Arcos da Lapa, Rua Joaquim Silva', lat: -22.913, lng: -43.1797,
    capa: u('photo-1514525253161-7a46d19cd819'), horario: 'Hoje · 22h às 5h', preco: 'R$ 30',
    descricao: 'Samba, funk e charme debaixo dos Arcos. A noite carioca começa aqui.',
    tags: ['samba', 'funk', 'charme'], live: true, cor: '#FF2E63',
  },
  {
    id: 'pagode-madureira', nome: 'Pagode em Madureira', bairro: 'Madureira', zona: 'Zona Norte',
    endereco: 'Viaduto Negrão de Lima', lat: -22.8735, lng: -43.3395,
    capa: u('photo-1516450360452-9312f5e86fc7'), horario: 'Hoje · 19h às 2h', preco: 'R$ 20',
    descricao: 'Pagode raiz no coração do subúrbio. Cerveja gelada e roda até o fim.',
    tags: ['pagode', 'samba'], live: true, cor: '#FF8A00',
  },
  {
    id: 'role-copacabana', nome: 'Rolê em Copacabana', bairro: 'Copacabana', zona: 'Zona Sul',
    endereco: 'Quiosque do Posto 5, Av. Atlântica', lat: -22.979, lng: -43.189,
    capa: u('photo-1483729558449-99ef09a8c325'), horario: 'Hoje · 18h às 1h', preco: 'Grátis',
    descricao: 'Música ao vivo no quiosque, pé na areia e a orla mais famosa do mundo.',
    tags: ['praia', 'ao vivo'], live: true, cor: '#00A3FF',
  },
  {
    id: 'bar-botafogo', nome: 'Bar em Botafogo', bairro: 'Botafogo', zona: 'Zona Sul',
    endereco: 'Rua Nelson Mandela, Baixo Botafogo', lat: -22.9505, lng: -43.184,
    capa: u('photo-1572116469696-31de0f17cc34'), horario: 'Hoje · 18h às 2h', preco: 'Consumo',
    descricao: 'Chopp gelado, petisco e a galera de Botafogo na calçada.',
    tags: ['bar', 'chopp'], live: true, cor: '#7C4DFF',
  },
  {
    id: 'funk-tijuca', nome: 'Funk na Tijuca', bairro: 'Tijuca', zona: 'Zona Norte',
    endereco: 'Quadra da Rua Conde de Bonfim', lat: -22.926, lng: -43.235,
    capa: u('photo-1470225620780-dba8ba36b745'), horario: 'Hoje · 23h às 6h', preco: 'R$ 25',
    descricao: 'Baile funk com os DJs da Tijuca. Paredão e muito passinho.',
    tags: ['funk', 'baile'], live: true, cor: '#00C48C',
  },
  {
    id: 'samba-pedra-do-sal', nome: 'Samba da Pedra do Sal', bairro: 'Centro', zona: 'Centro',
    endereco: 'Largo João da Baiana, Saúde', lat: -22.8975, lng: -43.1855,
    capa: u('photo-1533174072545-7a4b6ad7a6c3'), horario: 'Segunda · 19h às 0h', preco: 'Grátis',
    descricao: 'A roda de samba mais tradicional do Rio, na escadaria histórica.',
    tags: ['samba', 'roda'], live: false, cor: '#FFB800',
  },
  {
    id: 'luau-barra', nome: 'Luau na Barra', bairro: 'Barra da Tijuca', zona: 'Zona Oeste',
    endereco: 'Praia da Barra, Posto 4', lat: -23.011, lng: -43.342,
    capa: u('photo-1507525428034-b723cf961d3e'), horario: 'Sábado · 20h às 2h', preco: 'R$ 15',
    descricao: 'Fogueira, violão e lua cheia na areia da Barra.',
    tags: ['praia', 'luau'], live: false, cor: '#00BCD4',
  },
];

export const SEED_USERS = [
  { id: 'demo_ana', nome: 'Ana Clara', idade: 24, bairro: 'Tijuca', status: 'solteiro', foto: face('women', 44), bio: 'Tijucana, viciada em pagode 🎶', likesYou: true },
  { id: 'demo_joao', nome: 'João Pedro', idade: 27, bairro: 'Madureira', status: 'solteiro', foto: face('men', 32), bio: 'Portelense de coração 💙🤍', likesYou: true },
  { id: 'demo_bia', nome: 'Bia Santos', idade: 22, bairro: 'Copacabana', status: 'curtindo', foto: face('women', 68), bio: 'Praia de dia, rolê de noite ☀️🌙', likesYou: true },
  { id: 'demo_lucas', nome: 'Lucas Ferreira', idade: 25, bairro: 'Botafogo', status: 'so-de-role', foto: face('men', 75), bio: 'Chopp e conversa boa' },
  { id: 'demo_mari', nome: 'Mariana Lopes', idade: 26, bairro: 'Lapa', status: 'solteiro', foto: face('women', 21), bio: 'Samba no pé, sempre na Lapa 💃', likesYou: true },
  { id: 'demo_rafa', nome: 'Rafael Souza', idade: 29, bairro: 'Barra da Tijuca', status: 'solteiro', foto: face('men', 46), bio: 'Surf, luau e futevôlei', likesYou: true },
  { id: 'demo_julia', nome: 'Júlia Rocha', idade: 23, bairro: 'Vila Isabel', status: 'solteiro', foto: face('women', 12), bio: 'Noel Rosa me representa' },
  { id: 'demo_dudu', nome: 'Eduardo Lima', idade: 24, bairro: 'Tijuca', status: 'curtindo', foto: face('men', 11), bio: 'DJ nas horas vagas 🎧' },
  { id: 'demo_carol', nome: 'Carol Mendes', idade: 28, bairro: 'Centro', status: 'so-de-role', foto: face('women', 90), bio: 'Pedra do Sal toda segunda' },
  { id: 'demo_thiago', nome: 'Thiago Alves', idade: 26, bairro: 'Méier', status: 'solteiro', foto: face('men', 83), bio: 'Zona Norte é outra energia' },
  { id: 'demo_lari', nome: 'Larissa Costa', idade: 21, bairro: 'Penha', status: 'solteiro', foto: face('women', 55), bio: 'Passinho e funk 150 bpm', likesYou: true },
  { id: 'demo_gabi', nome: 'Gabriela Nunes', idade: 25, bairro: 'Flamengo', status: 'curtindo', foto: face('women', 33), bio: 'Aterro, bike e barzinho' },
].map((x) => ({ ...x, demo: true, vip: false, recomendacoes: [] }));

// quem está em cada rolê
const PRESENCA = {
  'baile-da-lapa': ['demo_mari', 'demo_carol', 'demo_ana', 'demo_rafa', 'demo_julia', 'demo_thiago'],
  'pagode-madureira': ['demo_joao', 'demo_thiago', 'demo_lari', 'demo_ana'],
  'role-copacabana': ['demo_bia', 'demo_lucas', 'demo_gabi', 'demo_rafa', 'demo_mari'],
  'bar-botafogo': ['demo_lucas', 'demo_gabi', 'demo_julia'],
  'funk-tijuca': ['demo_dudu', 'demo_lari', 'demo_ana', 'demo_joao', 'demo_bia'],
  'samba-pedra-do-sal': ['demo_carol'],
  'luau-barra': ['demo_rafa'],
};

export function buildSeedCheckins(now = Date.now()) {
  const out = [];
  Object.entries(PRESENCA).forEach(([roleId, users]) => users.forEach((userId, i) => {
    const role = SEED_ROLES.find((r) => r.id === roleId);
    out.push({ id: `${userId}_${roleId}`, userId, roleId, status: role.live ? 'aqui' : 'vou', createdAt: now - (i + 1) * 9 * 60 * 1000 });
  }));
  return out;
}

const POSTS = [
  ['demo_mari', 'baile-da-lapa', 'photo-1492684223066-81342ee5ff30', 'Lapa tá on hoje! Quem brota? 🔥', 'feed', 0.4],
  ['demo_joao', 'pagode-madureira', 'photo-1501281668745-f7f57925c3b4', 'Roda de pagode lotada em Madureira 🎶🍺', 'feed', 0.9],
  ['demo_bia', 'role-copacabana', 'photo-1519046904884-53103b34b206', 'Pôr do sol em Copa e o rolê só começando ☀️', 'feed', 1.5],
  ['demo_dudu', 'funk-tijuca', 'photo-1429962714451-bb934ecdc4ec', 'Paredão ligado na Tijuca 🔊', 'feed', 2.2],
  ['demo_lucas', 'bar-botafogo', 'photo-1514933651103-005eec06c04b', 'Chopp gelado no Baixo Bota 🍻', 'feed', 3],
  ['demo_carol', 'samba-pedra-do-sal', 'photo-1506157786151-b8491531f063', 'Segunda é dia de Pedra do Sal, não falha', 'feed', 5],
  ['demo_rafa', 'luau-barra', 'photo-1504609813442-a8924e83f76e', 'Luau na Barra sábado, já separa a canga 🌕', 'feed', 7],
  ['demo_gabi', 'role-copacabana', 'photo-1527529482837-4698179dc6ce', 'A galera toda reunida em Copa 🥂', 'feed', 9],
  ['demo_lari', 'funk-tijuca', 'photo-1496024840928-4c417adf211d', 'Hoje tem passinho! 💥', 'feed', 11],
  ['demo_mari', 'baile-da-lapa', 'photo-1515886657613-9f3515b0c78f', 'Me arrumando pro rolê na Lapa 💃✨', 'arrumando', 0.6],
  ['demo_ana', 'pagode-madureira', 'photo-1487412947147-5cebf100ffc2', 'Make pronta, partiu pagode em Madureira 💄', 'arrumando', 1.1],
  ['demo_bia', 'role-copacabana', 'photo-1524504388940-b1c1722653e1', 'Look de praia pro rolê em Copa 👙', 'arrumando', 1.8],
  ['demo_rafa', 'luau-barra', 'photo-1506794778202-cad84cf45f1d', 'Camisa florida = luau garantido 🌺', 'arrumando', 2.5],
  ['demo_lari', 'funk-tijuca', 'photo-1529626455594-4ff0802cfb7e', 'Me arrumando pro baile na Tijuca 🔥', 'arrumando', 3.2],
  ['demo_julia', 'bar-botafogo', 'photo-1517841905240-472988babdf9', 'Batom vermelho e Botafogo me esperando', 'arrumando', 4],
  ['demo_thiago', 'pagode-madureira', 'photo-1500648767791-00dcc994a43e', 'Kit pagode: boné, cordão e sorriso 😁', 'arrumando', 4.6],
  ['demo_gabi', 'bar-botafogo', 'photo-1534528741775-53994a69daeb', 'Pronta pro happy hour 🍸', 'arrumando', 5.5],
];

const COMMENTS = ['Brotando! 🔥', 'Tô indo!', 'Que lugar é esse?? 😍', 'Guarda lugar pra mim', 'Melhor rolê do Rio', 'Partiu!!'];

export function buildSeedPosts(now = Date.now()) {
  const ids = SEED_USERS.map((x) => x.id);
  return POSTS.map(([userId, roleId, photo, legenda, tipo, hoursAgo], i) => ({
    id: `seed_post_${i}`,
    userId, roleId, legenda, tipo,
    mediaUrl: u(photo, 1080), mediaType: 'image',
    likedBy: ids.filter((_, k) => (k * 7 + i) % 3 === 0),
    likesExtra: 40 + ((i * 53) % 260),
    savedBy: [],
    comments: [0, 1].slice(0, (i % 3)).map((k) => ({
      userId: ids[(i + k + 3) % ids.length], texto: COMMENTS[(i + k) % COMMENTS.length], createdAt: now - (hoursAgo * H) / 2,
    })),
    createdAt: now - hoursAgo * H,
  }));
}
