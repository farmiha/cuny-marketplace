# CUNY Marketplace 🏫

## Summary

CUNY Marketplace is a web application where CUNY students can list items for sale, browse and search listings from their campus, and message buyers or sellers directly on the site. The goal of this project is to make students' lives easier and safer in getting the essentials they need from people they can trust at an affordable price that fits their budget.

## Problem

Every semester, CUNY students face the same cycle: buying overpriced textbooks and dorm or apartment essentials, then abandoning them a few months later because there's no easy way to resell them. General marketplace apps like Facebook Marketplace or eBay do work, but come with drawbacks for students:

- There's no way to confirm if the seller or buyer is actually a student. Safety and trust are a gamble.
- Listings aren't organized around campus life; there isn't a way to filter by dorm, library, or building meetup spots.
- Buyers and sellers are spread across an entire city, not a five-block campus, making meetups inconvenient.
- There are no categories built for students to trade college essentials (course textbooks, dorm furniture, cheap electronics).

The result is that usable, affordable items end up in the trash, and students overpay for essentials when one of their classmates would have sold them for a lower price. This also affects our ecosystem negatively because it increases overconsumption when usable items go to waste.

## Solution

CUNY Marketplace solves this by building a marketplace around one simple restriction: you must have a verified `@stu-mail.[CAMPUS].cuny.edu` email to join. That single feature changes everything. Every listing, every buyer, and every seller is a real, verifiable CUNY student. Along with this, the platform gives students the tools to trade quickly and safely, allowing the following:

- **Student Verification** — sign-up is restricted to `@stu-mail.[CAMPUS].cuny.edu` addresses, so every user on the platform is a confirmed CUNY student.
- **Listings** — post items for sale with photos, price, and category in under a minute.
- **Search & Filters** — find exactly what you need by category or keyword instead of scrolling endlessly.
- **In-App Messaging** — chat directly with a buyer or seller without giving out a phone number.
- **Safety Tools** — report or block suspicious listings and users, keeping the community trustworthy.
- **Admin Dashboard & Analytics** — a separate panel (not the seller dashboard) showing platform health: reported listings queue for moderators, most active campuses, top categories, and daily new listings. This is genuinely useful for a pitch fest demo too — it shows scale thinking, not just a CRUD app.

## Why Is This Impactful?

CUNY is the largest urban public university system in the country, which means the impact of this platform scales far beyond one campus. The impact is felt directly by students:

- **Affordability** — students save money on textbooks, electronics, and furniture instead of paying retail or throwing away usable items.
- **Sustainability** — reuse keeps functional items out of landfills at the end of every semester.
- **Safety** — a verified, closed community removes the anxiety of meeting a stranger online.
- **Community** — buying and selling within your own school builds stronger peer connections and campus trust.
- **Scalability** — a model that works at CUNY can expand campus by campus across all 25 CUNY schools, growing the user base and inventory with every school added.

> **Note:** For the purpose of reaching the MVP of our product, we have selected 5 out of the 25 CUNY schools out there, each representing different boroughs: **Hunter, Brooklyn, CSI, Baruch, and Queens**. Later on, we will add other campuses.

## Technical Approach

This is our tech stack for developing the MVP of our product:

| Layer               | Tech                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Frontend            | React + JavaScript                                                                       |
| Backend             | Node.js + Express.js API routes                                                          |
| Real-time messaging | Socket.io                                                                                |
| Database            | Supabase (PostgreSQL) + Prisma ORM                                                       |
| Storage             | Supabase Storage for listing image uploads                                               |
| Authentication      | Supabase Auth/JWT restricted to `@stu-mail.[CAMPUS].cuny.edu`, campus selected at signup |
| Cart and Payment    | Stripe                                                                                   |
| Deployment          | Vercel (frontend) + Render (backend)                                                     |
