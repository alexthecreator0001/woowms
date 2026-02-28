import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const router = Router();

const CACHE_DIR = process.env.IMAGE_CACHE_DIR || '/tmp/picknpack-images';
const MAX_WIDTH = 800;
const FETCH_TIMEOUT = 10000;

// Ensure cache directory exists
fs.mkdirSync(CACHE_DIR, { recursive: true });

function getCacheKey(url: string, width: number): string {
  return crypto.createHash('sha256').update(`${url}:${width}`).digest('hex');
}

// GET /api/v1/images/proxy?url=<encoded_url>&w=<width>
router.get('/proxy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, w } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: true, message: 'Missing url parameter', code: 'VALIDATION_ERROR' });
    }

    // Validate URL is HTTP(S)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: true, message: 'URL must be HTTP or HTTPS', code: 'VALIDATION_ERROR' });
      }
    } catch {
      return res.status(400).json({ error: true, message: 'Invalid URL', code: 'VALIDATION_ERROR' });
    }

    const width = Math.min(Math.max(parseInt(String(w)) || 96, 16), MAX_WIDTH);
    const cacheKey = getCacheKey(url, width);
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.webp`);

    // Cache hit — stream from disk
    if (fs.existsSync(cachePath)) {
      res.set({
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400',
      });
      return fs.createReadStream(cachePath).pipe(res);
    }

    // Cache miss — fetch, resize, cache
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let response: globalThis.Response;
    try {
      response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
    } catch {
      clearTimeout(timeout);
      return res.status(502).json({ error: true, message: 'Failed to fetch image', code: 'FETCH_ERROR' });
    }

    if (!response.ok) {
      return res.status(502).json({ error: true, message: 'Upstream image returned error', code: 'FETCH_ERROR' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    let processed: Buffer;
    try {
      processed = await sharp(buffer)
        .resize(width, undefined, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return res.status(422).json({ error: true, message: 'Failed to process image', code: 'PROCESSING_ERROR' });
    }

    // Write to cache (fire-and-forget)
    fs.writeFile(cachePath, processed, () => {});

    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(processed);
  } catch (err) {
    next(err);
  }
});

export default router;
