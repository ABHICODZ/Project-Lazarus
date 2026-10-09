import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { getPosts } from '../../utils/posts';

// Satori accepts TTF, OTF and WOFF (not WOFF2), so use the static fontsource files.
const font = (pkg: string, file: string) => readFileSync(`node_modules/${pkg}/files/${file}`);
const serif = font('@fontsource/eb-garamond', 'eb-garamond-latin-500-normal.woff');
const mono = font('@fontsource/courier-prime', 'courier-prime-latin-400-normal.woff');

const INK = '#F4F2EC', PAPER = '#121212', GRAPHITE = '#B0AEA8', ACCENT = '#E06D5C';

type Card = { title: string; tag: string; footer: string };

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts();
  return [
    { params: { slug: 'default' }, props: { card: { title: 'Project Lazarus', tag: 'ARCHIVE', footer: 'Research Notes & Working Papers' } as Card } },
    ...posts.map((p) => ({
      params: { slug: p.id },
      props: { card: { title: p.data.title, tag: p.data.tag, footer: `Project Lazarus // ${p.data.date}` } as Card },
    })),
  ];
};

// Satori takes React-style element objects; building them by hand avoids needing JSX here.
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style: { display: 'flex', ...style }, children } });

export const GET: APIRoute = async ({ props }) => {
  const { title, tag, footer } = props.card as Card;
  const size = title.length > 60 ? 64 : title.length > 36 ? 80 : 96;

  const tree = el('div', { width: '100%', height: '100%', boxSizing: 'border-box', flexDirection: 'column', justifyContent: 'space-between', background: PAPER, padding: 80, borderLeft: `12px solid ${ACCENT}` }, [
    el('div', { fontFamily: 'Courier Prime', fontSize: 28, letterSpacing: 6, color: ACCENT }, `[${tag}]`),
    el('div', { fontFamily: 'EB Garamond', fontSize: size, lineHeight: 1.08, color: INK }, title),
    el('div', { fontFamily: 'Courier Prime', fontSize: 28, color: GRAPHITE }, footer),
  ]);

  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'EB Garamond', data: serif, weight: 500, style: 'normal' },
      { name: 'Courier Prime', data: mono, weight: 400, style: 'normal' },
    ],
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
