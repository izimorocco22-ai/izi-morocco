// ---------------------------------------------------------------------------
// App Store / Play Store REVIEW account (temporary).
//
// Apple & Google reviewers need to sign in without access to a real email
// inbox for the OTP. This module provides ONE fixed demo login and a fixed
// OTP, scoped strictly to the single email below. No other account is
// affected in any way. Login for every real user still requires the correct
// password and a real emailed OTP.
//
// Remove this file and its three usages (login, verifyAccount, db startup)
// once the app is approved.
// ---------------------------------------------------------------------------
import bcrypt from 'bcrypt'
import Players from '../db/models/players.schema'
import { generateUUID } from './uuid'

export const REVIEW_ACCOUNT = {
  email: 'test@gmail.com',
  password: 'test@123',
  name: 'App Review',
  otp: '123456'
}

// Case/space-insensitive match so an iOS keyboard can't break the comparison.
export const isReviewEmail = (email: unknown): boolean =>
  String(email || '').trim().toLowerCase() === REVIEW_ACCOUNT.email

// Idempotently make sure the reviewer exists as a verified player.
// Returns the playerId, or null if the DB write failed.
export const ensureReviewAccount = async (): Promise<string | null> => {
  try {
    const existing: any = await Players.findOne({ email: REVIEW_ACCOUNT.email }).lean()
    if (existing) {
      if (!existing.isVerified) {
        await Players.updateOne(
          { email: REVIEW_ACCOUNT.email },
          { isVerified: true, updatedAt: new Date() }
        )
      }
      return existing.playerId
    }

    const playerId = generateUUID()
    const password = await bcrypt.hash(REVIEW_ACCOUNT.password, 10)
    await Players.create({
      playerId,
      name: REVIEW_ACCOUNT.name,
      email: REVIEW_ACCOUNT.email,
      password,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`[REVIEW] Provisioned review account ${REVIEW_ACCOUNT.email}`)
    return playerId
  } catch (e) {
    console.error('[REVIEW] ensureReviewAccount failed:', e)
    return null
  }
}
