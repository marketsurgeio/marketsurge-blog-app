#!/bin/bash

# Create the Next.js project with all prompts answered
npx create-next-app@latest blog-forge \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir \
  --no-turbo \
  --import-alias "@/*" \
  --use-npm 