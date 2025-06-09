// Manages wizard state in Redis
import { redisClient } from '../lib/redis';

export async function getWizardState(sessionId: string) {
  console.log('⚪⚪⚪ - [getWizardState] CALLED with sessionId:', sessionId);
  try {
    const data = await redisClient.get(`wizard:${sessionId}`);
    console.log('⚪⚪⚪ - [getWizardState] RAW DATA from Redis:', data);
    const parsed = data ? JSON.parse(data) : null;
    console.log('⚪⚪⚪ - [getWizardState] PARSED DATA:', JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (err) {
    console.error('⚠️⚠️⚠️ - [getWizardState] ERROR:', err);
    return null;
  }
}

export async function setWizardState(sessionId: string, state: any) {
  console.log('⚪⚪⚪ - [setWizardState] CALLED with sessionId:', sessionId);
  console.log('⚪⚪⚪ - [setWizardState] STATE to set:', JSON.stringify(state, null, 2));
  console.log('⚪⚪⚪ - [setWizardState] STACK TRACE:', new Error().stack);
  try {
    await redisClient.set(`wizard:${sessionId}`, JSON.stringify(state));
    console.log('⚪⚪⚪ - [setWizardState] STATE SET SUCCESSFULLY for key:', `wizard:${sessionId}`);
    return true;
  } catch (err) {
    console.error('⚠️⚠️⚠️ - [setWizardState] ERROR:', err);
    return false;
  }
}

export async function updateWizardState(sessionId: string, partial: any) {
  console.log('⚪⚪⚪ - [updateWizardState] CALLED with sessionId:', sessionId);
  console.log('⚪⚪⚪ - [updateWizardState] PARTIAL update:', JSON.stringify(partial, null, 2));
  console.log('⚪⚪⚪ - [updateWizardState] STACK TRACE:', new Error().stack);
  try {
    const current = await getWizardState(sessionId) || {};
    console.log('⚪⚪⚪ - [updateWizardState] CURRENT state before update:', JSON.stringify(current, null, 2));
    const updated = { ...current, ...partial };
    console.log('⚪⚪⚪ - [updateWizardState] MERGED state to save:', JSON.stringify(updated, null, 2));
    await setWizardState(sessionId, updated);
    return updated;
  } catch (err) {
    console.error('⚠️⚠️⚠️ - [updateWizardState] ERROR:', err);
    return null;
  }
}

export async function deleteWizardState(sessionId: string) {
  console.log('⚪⚪⚪ - [deleteWizardState] CALLED with sessionId:', sessionId);
  console.log('⚪⚪⚪ - [deleteWizardState] STACK TRACE:', new Error().stack);
  try {
    await redisClient.del(`wizard:${sessionId}`);
    console.log('⚪⚪⚪ - [deleteWizardState] STATE DELETED for key:', `wizard:${sessionId}`);
    return true;
  } catch (err) {
    console.error('⚠️⚠️⚠️ - [deleteWizardState] ERROR:', err);
    return false;
  }
}
