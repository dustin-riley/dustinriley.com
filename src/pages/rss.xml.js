import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { statSync } from "node:fs";
import { extname } from "node:path";
import config from "@/config/config.json";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// Build an enclosure entry from a post's frontmatter `image` (e.g.
// "/images/posts/foo.png"). Reads the file from public/ to populate
// length, since RSS spec requires it. Returns null if the asset is
// missing — better to ship the item without an image than to break
// the feed with a 0-byte enclosure.
function buildEnclosure(image, siteUrl) {
  if (!image) return null;
  const ext = extname(image).toLowerCase();
  const type = MIME_BY_EXT[ext];
  if (!type) return null;
  try {
    const length = statSync(`public${image}`).size;
    return { url: new URL(image, siteUrl).href, length, type };
  } catch {
    return null;
  }
}

export async function GET(context) {
  const posts = await getCollection("posts", ({ id, data }) => {
    return !id.startsWith("-") && data.draft !== true;
  });

  const sorted = posts
    .filter((p) => p.data.date)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const siteUrl = context.site ?? config.site.base_url;

  return rss({
    title: "dustinriley — writing",
    description: config.metadata.meta_description,
    site: siteUrl,
    trailingSlash: false,
    items: sorted.map((post) => {
      const enclosure = buildEnclosure(post.data.image, siteUrl);
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description ?? "",
        link: `/${post.id.replace(/\.(md|mdx)$/, "")}`,
        categories: [...(post.data.categories ?? []), ...(post.data.tags ?? [])],
        ...(enclosure && { enclosure }),
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
