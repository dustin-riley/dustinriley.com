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

I'm the guy who plans his fall Saturdays around the college football schedule. I went to Miami (Ohio) — Love and Honor — and I still travel to away games with friends whenever I can. It's one of my favorite things in the world. So when I say this project started because I'm a college football nerd, I need you to understand the depth of that statement.

## How This Started

I was scrolling Twitter/X and stumbled into a thread where FBS Communications Directors were sharing scorigami charts for their programs. One posted theirs, another replied saying they were going to make one for their school. It was a whole thing.

<blockquote class="twitter-tweet" data-theme="light">
  <a href="https://twitter.com/DaveMeyerMU/status/1944756268561826098"></a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

And my immediate thought was: why isn't there a site where any fan can just look this up for their team?

If you're not familiar with scorigami — Jon Bois popularized the concept. It's the idea that certain final scores in a sport have literally never happened before. When one occurs, that's a scorigami. His video on it is fantastic and you should watch it:

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

So I had the idea. I had the motivation. I had evenings and weekends. Time to build something.

## The Build

I went with **Next.js 15** for this one — partly because it fit the use case well and partly because I hadn't used it yet and wanted to learn. The rest of the stack:

- **React 19 + TypeScript** on the frontend
- **Tailwind CSS v4** with **shadcn/ui** for components
- **PostgreSQL on Neon** for the database
- **Vercel** for hosting
- **College Football Data API (CFBD)** as the data source

### Getting the Data In

The [College Football Data API](https://collegefootballdata.com/) is a gift to anyone building sports projects. It's free for developers and has an absurd amount of historical game data.

My first version just hit the API directly. That worked fine until someone tried to load something like all SEC games across 20+ years. The API would time out after 30 seconds and the user would get nothing. Not great.

So I set up a PostgreSQL database on Neon and built a data pipeline to pull games from CFBD and store them locally. Now the site queries its own database instead of hammering an external API on every request. Faster for users, more reliable, and it lets me do filtering and aggregations that would've been painful to do through API calls alone.

### The Heatmap

This was the fun part. The whole visualization is a heatmap — winning score on one axis, losing score on the other, and each cell is colored by how many times that exact score has occurred.

I actually started with ApexCharts for this, but it felt like bringing a sledgehammer to hang a picture frame. What I really needed was a colored grid. So I ripped it out and built the heatmap with pure CSS Grid and Tailwind. Each cell is a div. The color intensity scales based on frequency. That's it.

The result was a way smaller bundle, faster rendering (especially on big datasets), and honestly better mobile behavior. Sometimes the boring solution is the right one.

### Filtering

The whole point was to let people explore scorigami for *their* team, so filtering is core to the experience. You can filter by team, conference, date range — slice it however you want. The filters hit the Postgres database through Next.js API routes and the heatmap re-renders with the results.

## Go Play With It

The site is live at [scorigami.dustinriley.com](https://scorigami.dustinriley.com). Go look up your team. Find the weird scores. Text your friends about them. That's literally why I built it.

This was one of those projects where the motivation was never "this will look good on a resume." I just love college football, I love building things, and I saw a gap I could fill. Those are the best side projects — the ones where you're your own target user.

*Check it out at [scorigami.dustinriley.com](https://scorigami.dustinriley.com) and let me know what you find.*
