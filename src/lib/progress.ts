let currentProgress = {
  attempt: 1,
  maxAttempts: 5,
  currentWordCount: 0,
  targetWordCount: 2000
};

export function updateProgress(progress: typeof currentProgress) {
  currentProgress = { ...progress };
}

export function getCurrentProgress() {
  return { ...currentProgress };
} 