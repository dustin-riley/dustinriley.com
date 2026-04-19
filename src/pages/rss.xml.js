import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import config from "@/config/config.json";

export async function GET(context) {
  const posts = await getCollection("posts", ({ id, data }) => {
    return !id.startsWith("-") && data.draft !== true;
  });

  const sorted = posts
    .filter((p) => p.data.date)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "dustinriley — writing",
    description: config.metadata.meta_description,
    site: context.site ?? config.site.base_url,
    trailingSlash: false,
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? "",
      link: `/${post.id.replace(/\.(md|mdx)$/, "")}`,
      categories: [...(post.data.categories ?? []), ...(post.data.tags ?? [])],
    })),
    customData: `<language>en-us</language>`,
  });
}
