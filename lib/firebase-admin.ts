import admin from 'firebase-admin';
import { existsSync } from 'fs';

if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath && existsSync(serviceAccountPath)) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath),
            });
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT_PATH not found or file does not exist in .env");
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const messagingAdmin = admin.apps.length ? admin.messaging() : null;

export async function sendFCMNotification(
    token: string,
    title: string,
    body: string,
    data?: any,
    link?: string
) {
    if (!messagingAdmin) {
        console.error("FCM messagingAdmin not initialized");
        return;
    }

    try {
        const messageData = data ? { ...data } : {};
        if (link) messageData.link = link;

        const message: admin.messaging.Message = {
            notification: {
                title,
                body,
            },
            data: Object.fromEntries(
                Object.entries(messageData).map(([k, v]) => [k, String(v)])
            ),
            token: token,
            webpush: {
                fcmOptions: {
                    link: link || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'
                }
            }
        };

        const response = await messagingAdmin.send(message);
        console.log('Successfully sent FCM message:', response);
        return response;
    } catch (error) {
        console.error('Error sending FCM message:', error);
    }
}

export async function sendMulticastFCMNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
    link?: string
) {
    if (!messagingAdmin || tokens.length === 0) return;

    try {
        const messageData = data ? { ...data } : {};
        if (link) messageData.link = link;

        const message: admin.messaging.MulticastMessage = {
            notification: {
                title,
                body,
            },
            data: Object.fromEntries(
                Object.entries(messageData).map(([k, v]) => [k, String(v)])
            ),
            tokens: tokens,
            webpush: {
                fcmOptions: {
                    link: link || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'
                }
            }
        };

        const response = await messagingAdmin.sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} FCM messages out of ${tokens.length}`);
        return response;
    } catch (error) {
        console.error('Error sending multicast FCM message:', error);
    }
}
