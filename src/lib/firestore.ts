import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  thumbnailUrl: string;
  status: 'draft' | 'published';
  publishedUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  industry: string;
  topic: string;
}

export type SortField = 'createdAt' | 'title' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface GetPostsOptions {
  userId: string;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  status?: 'draft' | 'published';
  industry?: string;
  search?: string;
}

export const blogPostsCollection = collection(db, 'blog_posts');

export async function createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(blogPostsCollection, {
    ...post,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now)
  });
  return docRef.id;
}

export async function getUserBlogPosts({
  userId,
  pageSize = 10,
  lastDoc,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  status,
  industry,
  search
}: GetPostsOptions): Promise<{
  posts: BlogPost[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> {
  let q = query(
    blogPostsCollection,
    where('userId', '==', userId)
  );

  // Add status filter if provided
  if (status) {
    q = query(q, where('status', '==', status));
  }

  // Add industry filter if provided
  if (industry) {
    q = query(q, where('industry', '==', industry));
  }

  // Add search filter if provided
  if (search) {
    q = query(q, where('title', '>=', search), where('title', '<=', search + '\uf8ff'));
  }

  // Add sorting
  q = query(q, orderBy(sortBy, sortOrder));

  // Add pagination
  q = query(q, limit(pageSize + 1)); // Get one extra to check if there are more
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const querySnapshot = await getDocs(q);
  const posts = querySnapshot.docs.slice(0, pageSize).map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate()
  })) as BlogPost[];

  const hasMore = querySnapshot.docs.length > pageSize;
  const lastVisibleDoc = hasMore ? querySnapshot.docs[pageSize - 1] : null;

  return {
    posts,
    lastDoc: lastVisibleDoc,
    hasMore
  };
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export async function getPostById(id: string) {
  const postRef = doc(blogPostsCollection, id);
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) return null;
  const post = postDoc.data();
  return {
    id: postDoc.id,
    ...post,
    createdAt: post.createdAt.toDate(),
    updatedAt: post.updatedAt.toDate()
  };
} 