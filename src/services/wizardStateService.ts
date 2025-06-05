// Manages wizard state in Redis
import { redisClient } from '../lib/redis';

export async function getWizardState(sessionId: string) {
  console.log('🟡🟡🟡 - [getWizardState] called:', sessionId);
  try {
    const data = await redisClient.get(`wizard:${sessionId}`);
    const parsed = data ? JSON.parse(data) : null;
    console.log('🟡🟡🟡 - [getWizardState] return:', parsed);
    return parsed;
  } catch (err) {
    console.error('❗❗❗ - [getWizardState] error:', err);
    return null;
  }
}

export async function setWizardState(sessionId: string, state: any) {
  console.log('🟡🟡🟡 - [setWizardState] called:', sessionId, state);
  try {
    await redisClient.set(`wizard:${sessionId}`, JSON.stringify(state));
    console.log('🟡🟡🟡 - [setWizardState] state set');
    return true;
  } catch (err) {
    console.error('❗❗❗ - [setWizardState] error:', err);
    return false;
  }
}

export async function updateWizardState(sessionId: string, partial: any) {
  console.log('🟡🟡🟡 - [updateWizardState] called:', sessionId, partial);
  try {
    const current = await getWizardState(sessionId) || {};
    const updated = { ...current, ...partial };
    await setWizardState(sessionId, updated);
    console.log('🟡🟡🟡 - [updateWizardState] state updated:', updated);
    return updated;
  } catch (err) {
    console.error('❗❗❗ - [updateWizardState] error:', err);
    return null;
  }
}

export async function deleteWizardState(sessionId: string) {
  console.log('🟡🟡🟡 - [deleteWizardState] called:', sessionId);
  try {
    await redisClient.del(`wizard:${sessionId}`);
    console.log('🟡🟡🟡 - [deleteWizardState] state deleted');
    return true;
  } catch (err) {
    console.error('❗❗❗ - [deleteWizardState] error:', err);
    return false;
  }
}
