import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export async function storeArticle(userId: string, articleData: any) {
  console.log('Storing article for user:', userId, articleData);
  try {
    await db.collection('articles').doc(userId).set({
      ...articleData,
      userId,
      createdAt: new Date().toISOString()
    });
    console.log('Article stored successfully');
  } catch (error) {
    console.error('Error storing article:', error);
    throw error;
  }
}

export async function getArticle(userId: string) {
  console.log('Getting article for user:', userId);
  try {
    const doc = await db.collection('articles').doc(userId).get();
    if (!doc.exists) {
      console.log('No article found for user:', userId);
      return null;
    }
    console.log('Article found:', doc.data());
    return doc.data();
  } catch (error) {
    console.error('Error getting article:', error);
    throw error;
  }
}

export async function clearArticle(userId: string) {
  console.log('Clearing article for user:', userId);
  try {
    await db.collection('articles').doc(userId).delete();
    console.log('Article cleared successfully');
  } catch (error) {
    console.error('Error clearing article:', error);
    throw error;
  }
} 