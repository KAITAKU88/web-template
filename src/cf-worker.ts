/**
 * Cloudflare Workers entry point.
 *
 * Wraps the OpenNext handler (generated at build time) and adds Cloudflare
 * Cron Triggers for scheduled tasks — no external cron service needed.
 *
 * Build order: `npx @opennextjs/cloudflare build` → generates .open-next/worker.js
 *              `wrangler deploy`                  → bundles this file + that output
 */

// @ts-ignore — .open-next/worker.js is generated at build time, not in source tree
import openNextWorker from "../.open-next/worker.js";

interface Env {
  CRON_SECRET?: string;
  [key: string]: unknown;
}

// Gọi Next.js API route nội bộ — không cần biết domain thực
async function runCron(
  path: string,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  try {
    const req = new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET ?? "" },
    });
    await openNextWorker.fetch(req, env, ctx);
  } catch (err) {
    console.error(`[cron] ${path} failed:`, err);
  }
}

export default {
  // Delegate tất cả HTTP requests cho OpenNext (Next.js)
  fetch: openNextWorker.fetch,

  // Cloudflare Cron Trigger — chạy theo lịch trong wrangler.toml [triggers]
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await Promise.all([
      runCron("/api/cron/expire-orders", env, ctx),
      runCron("/api/cron/abandoned-cart", env, ctx),
      runCron("/api/cron/scheduled-campaigns", env, ctx),
    ]);
  },
} satisfies ExportedHandler<Env>;
