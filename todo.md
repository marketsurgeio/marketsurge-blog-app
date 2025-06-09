# MarketSurge Blog Generation App

## 0. TL;DR
**Goal**: One-click generation → review → publish of 2,000-word, SEO-optimized blog posts (HTML) to the GoHighLevel blog, plus a branded thumbnail.

**Stack**: 
- Next.js 14 (App Router)
- TypeScript
- Serverless (Vercel / Cloud Run)
- OpenAI
- GHL REST API
- S3 (or GCS)
- JWT Auth (Clerk)
- Node-Canvas (thumbnail)

**Must-ship by**: Yesterday

## 1. Spec (WHAT to build)

### Feature Details / Acceptance Criteria

#### Prompt Form
- Fields: topic (string), industry (select · default = General)
- "Generate Ideas" button

#### Headline Suggestions
- Use OpenAI chat → return 3 keyword-rich titles
- Display as clickable cards

#### Article Generation
- On card click, call OpenAI again → 2,000-word HTML
- Injected CTA button: `<a class="ms-cta" href="https://marketsurge.io/KEY">Start Growing →</a>`

#### Thumbnail
- 1200×628 px
- Background = DALL·E / Unsplash image based on topic
- Overlay: title (wrap, center), MarketSurge logo top-left
- Color: pick bright hue w/ WCAG AA contrast against overlay box

#### Regenerate
- Rerun step above, replace draft (but keep history)

#### Publish to GHL
- POST to /blogs/posts with {blogId, title, html, featuredImageUrl, status:"Published"}
- Success → toast + mark as "Published"
- Fail → toast + log error

#### History dashboard
- Table: title · status · date · "View" · "Clone"
- Store in Firestore (or Dynamo)

#### Auth
- Clerk (JWT)
- Only authenticated users can generate / publish

#### Cost guard-rails
- Log OpenAI token usage
- Stop user at $X/day
- env DAILY_BUDGET_CAP

#### CI/CD
- GitHub → Vercel deploy preview on PR
- Pre-commit: eslint, prettier, npm test

#### Tests
- Unit tests on helpers, thumbnail generator, GHL client (msw)
- E2E smoke test (Playwright) → mock GHL

## 2. Architecture Diagram
```
Browser ─┬─> /api/ideas      (OpenAI chat   ) 
         ├─> /api/article    (OpenAI chat   ) 
         ├─> /api/thumbnail  (OpenAI img +  )
         │                   (node-canvas   ) 
         └─> /api/publish    (GHL REST      )
                       │
                       └──> S3 putObject  -> public URL
```

## 3. File / Folder Blueprint
```
/app
  /dashboard            # history page
  /generate            # form + suggestion list + draft preview
  /api
     ideas.ts
     article.ts
     thumbnail.ts
     publish.ts
/components
  PromptForm.tsx
  IdeaCard.tsx
  DraftPreview.tsx
  HistoryTable.tsx
/lib
  openai.ts            # shared OpenAI wrapper
  ghl.ts               # typed fetch helpers
  thumbnail.ts         # node-canvas code
  seo.ts               # slug & meta util
  costGuard.ts         # daily budget check
/types
/tests
/scripts              # one-off helpers
```

## 4. ENV Variables
```
OPENAI_API_KEY=
GHL_API_KEY=
GHL_BLOG_ID=
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DAILY_BUDGET_CAP=8      # USD
MARKETSURGE_LOGO_URL=https://...
```

## 5. Cursor Prompts
### Scaffold project
```bash
npx create-next-app@latest blog-forge \
  --typescript --eslint --tailwind --app --src-dir
```

### Generate OpenAI util
"Create lib/openai.ts that exports getIdeas(topic,industry) and getArticle(title,keywords) using GPT-4, temperature 0.7. Handle 429 with 3-retry exponential backoff."

### Thumbnail utility
"Write lib/thumbnail.ts using @napi-rs/canvas. It should:
- fetch base image via DALL·E (512×512) or fallback to Unsplash
- create 1200×628 canvas
- darken background 45% overlay
- overlay wrapped title in bold 60px 'Inter'
- draw logo from env URL
- export generateThumbnail(title): Promise<Buffer>"

### GHL client
"Implement lib/ghl.ts with publishPost({title,html,featuredImageUrl}) using fetch and the GHL API endpoint. Throw detailed error on non-200."

### Cost guard
"Create lib/costGuard.ts to tally OpenAI usage per user in Firestore openai_usage collection; deny if over DAILY_BUDGET_CAP."

### API routes
"Generate pages/api/[idea|article|thumbnail|publish].ts that read JWT from Clerk, run costGuard, call libs, return JSON or 500."

### Frontend components
"Build components/PromptForm.tsx with fields topic & industry, submit handler → api/ideas. Then IdeaCard list; onClick fetch /api/article and /api/thumbnail; show DraftPreview with HTML dangerouslySetInnerHTML; buttons Regenerate & Publish."

### History page
"Create /dashboard that reads Firestore posts collection (title, status, createdAt, url). Use Tailwind table; link to final URL."

### Test stubs
"Generate Jest unit test for thumbnail.ts mocking Canvas; ensure buffer length > 0."

### CI
```bash
gh repo create marketsurge/blog-forge --private
echo 'node_modules' > .dockerignore
npx vercel link
```

## 6. Example OpenAI Prompt Templates

### System:
You are an elite SaaS content strategist for marketing agencies.

### User:
Give me exactly three catchy, keyword-rich blog titles about "{topic}" for the {industry} industry. Titles ≤ 60 characters, active voice, include at least one high-intent keyword. Return JSON array.

---

### System:
You are a senior copywriter.

### User:
Write a 2,000-word HTML blog post titled "{title}" aimed at {industry} audience. Use H2/H3s, bullet lists, and include the following CTA block near the end:

```html
<section class="cta">
  <p>Ready to grow faster?</p>
  <a class="ms-cta" href="https://marketsurge.io/KEY">
     See how MarketSurge helps →
  </a>
</section>
```

Naturally weave in these keywords: {keywords}. Wrap code samples in `<pre><code>`. End with FAQ section.

## 7. Deployment Cheat-Sheet
```bash
# Local
pnpm i
pnpm dev

# Provision S3 + policy (skip if using Cloudinary)
aws s3 mb s3://ms-blog-thumbnails
aws s3 website s3://ms-blog-thumbnails --index-document index.html

# Deploy
vercel --prod
# Or
gcloud builds submit --tag gcr.io/<proj>/blog-forge
gcloud run deploy blog-forge --image gcr.io/<proj>/blog-forge --platform managed
```

## 8. Monitoring & Alerts
- OpenAI cost → CloudWatch metric filter on usage.total_tokens → SNS email at 80% of cap
- Publish errors → Sentry + Slack webhook
- Thumbnail latency → Vercel Analytics; resize DALL·E if > 2s

## 9. Re-usable Code Snippets (public)
- Node-Canvas text-wrap helper: https://github.com/Automattic/node-canvas#text-wrapping
- GHL Blog Post fetch sample (JS): https://gist.github.com/dan-hall/ghl-blog-post.js
- Next.js + OpenAI starter: https://github.com/openai-labs/nextjs-openai-starter
- Unsplash download API: https://unsplash.com/documentation#example-image
- Clerk with Next.js App Router boilerplate: https://github.com/clerkinc/examples/tree/main/nextjs-app-router

## Ship It Checklist ✅
- [ ] ENV vars in Vercel/GCP set
- [ ] Clerk JWT working locally
- [ ] Publish endpoint 200 OK in Postman
- [ ] Thumbnail displays in OG debugger
- [ ] OpenAI cost alarm hits Slack test channel
- [ ] Merge → Vercel preview green 

## 10. Fast-track Patches
- [ ] Unify usage + cost guard
  - Merge checkUsageLimit into Firestore-based costGuard
  - Drop the Map storage
- [ ] Add /api/publish endpoint
  - Implement GHL POST /blogs/posts payload
  - Add proper error handling
- [ ] Migrate storage
  - Swap Map storage for Firestore or Planetscale
  - Create drafts + posts collections
- [ ] Implement word-count loop
  - Add sentinel WORD_COUNT in footer
  - Retry generation until ≥ 1900 words
- [ ] Integrate thumbnail generation
  - Wire /api/thumbnail into article generation
  - Store S3 URL in Firestore
- [ ] Documentation
  - Create .env.example with all required variables:
    - Clerk
    - Firebase
    - OpenAI
    - GHL
- [ ] Testing
  - Add Jest unit test for usage tracking
  - Implement Playwright smoke test for /generate
- [ ] CI/CD
  - Set up GitHub Action:
    - pnpm lint
    - pnpm test
    - next build
- [ ] Security hardening
  - Add next-secure-headers
  - Implement rate limiting for API routes
  - Add origin checking for POST requests
- [ ] Deployment
  - Automate Vercel deployment
  - Verify Edge runtime compatibility 