---
title: "I Built a College Football Scorigami Tool Because I'm That Kind of Fan"
meta_title: "College Football Scorigami — A Side Project Born From Obsession"
description: "How a Twitter thread between FBS Communications Directors turned into a full-blown scorigami visualization tool. Built with Next.js, Postgres, and way too many late nights."
date: 2025-08-02T05:00:00Z
image: "/images/posts/cfb-friends-at-game.jpg"
categories: ["development", "data-visualization"]
authors: ["Dustin Riley"]
tags: ["college-football", "scorigami", "nextjs", "postgresql", "data-visualization", "side-project"]
draft: false
---

# I Built a College Football Scorigami Tool Because I'm That Kind of Fan

I plan my fall Saturdays around college football. Went to Miami (Ohio) — Love and Honor — and I still drive to away games whenever I can swing it. It's legitimately one of my favorite things.

So when I say this project started because I'm a college football nerd, understand that I mean it in the most sincere way possible.

## How This Started

I was scrolling Twitter and saw FBS Communications Directors sharing scorigami charts for their programs. One guy posted theirs, someone else replied they were going to make one too. Whole thread of them trading charts.

<blockquote class="twitter-tweet" data-theme="light">
  <a href="https://twitter.com/DaveMeyerMU/status/1944756268561826098"></a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

And I had the thought: why isn't there just a site where anyone can look this up for their team?

If you don't know scorigami — Jon Bois made it famous. The idea is simple: certain final scores have never happened before in a sport. When one finally occurs, that's scorigami. His video on it is great:

<div class="my-8 flex justify-center">
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/9l5C8cGMueY"
    title="Jon Bois: Chart Party - The Search for the Saddest Punt in the World"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
  </iframe>
</div>

So I had the idea, the motivation, and evenings after work. Let's build something.

## The Build

I went with **Next.js 15** — partly because it fit, partly because I hadn't used it yet. Stack:

- **React 19 + TypeScript** on the frontend
- **Tailwind CSS v4** with **shadcn/ui** for components
- **PostgreSQL on Neon** for the database
- **Vercel** for hosting
- **College Football Data API (CFBD)** as the data source

### Getting the Data In

The [College Football Data API](https://collegefootballdata.com/) is a gift. Free for developers, ridiculous amount of historical data.

First version just hit the API directly. Worked until someone loaded all SEC games over 20 years and it timed out. Not great.

So I set up PostgreSQL on Neon, built a pipeline to pull games from CFBD and cache them locally. Now the site queries its own database. Way faster, way more reliable, and I can do aggregations that would've been a nightmare through raw API calls.

### The Heatmap

This was the fun part. Winning score on one axis, losing score on the other, cells colored by how many times that score happened.

Started with ApexCharts. Felt like overkill. I just needed a colored grid. Ripped it out, rebuilt with CSS Grid and Tailwind. Each cell is a div. Color scales with frequency. Done.

Way smaller bundle, faster rendering, better on mobile. Sometimes boring is right.

### Filtering

The whole point was letting people explore *their* team, so filtering matters. Team, conference, date range — slice it however. Filters hit Postgres through API routes, heatmap updates.

## Go Play With It

The site's at [scorigami.dustinriley.com](https://scorigami.dustinriley.com). Look up your team. Find the weird scores. Text someone about it.

This wasn't for a resume. I just love college football and wanted the thing to exist. Best side projects are the ones you build for yourself.

*[scorigami.dustinriley.com](https://scorigami.dustinriley.com)*
