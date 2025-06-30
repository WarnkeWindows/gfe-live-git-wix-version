// Good Faith Exteriors - Velo Backend Authentication Helpers
// File: backend/auth.js
// NOTE: The specific code for this file was not provided.
// This content is a structural placeholder based on its documented purpose.

import wixUsers from 'wix-users-backend';
import wixData from 'wix-data';

/**
 * Checks if the current user has a specific role (e.g., 'Contractor', 'Admin').
 * This is crucial for securing access to features like the contractor portal.
 * @param {string} role - The role to check for.
 * @returns {Promise<boolean>} - True if the user has the role, false otherwise.
 */
export async function currentUserHasRole(role) {
    try {
        if (!wixUsers.currentUser.loggedIn) {
            return false;
        }
        const roles = await wixUsers.currentUser.getRoles();
        return roles.some(userRole => userRole.name === role);
    } catch (error) {
        console.error('Error checking user role:', error);
        return false;
    }
}

/**
 * Gets the full profile data for the current user from the GFE_Customers collection.
 * @returns {Promise<Object|null>} - The user's profile object or null if not found.
 */
export async function getCurrentUserProfile() {
    try {
        if (!wixUsers.currentUser.loggedIn) {
            return null;
        }
        const userId = wixUsers.currentUser.id;
        // The 'GFE_Customers' collection would need a field that references the Wix Member ID.
        // Assuming a field named 'wixUserId'.
        const results = await wixData.query('GFE_Customers')
            .eq('wixUserId', userId)
            .find();
            
        if (results.items.length > 0) {
            return results.items[0];
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Verifies if the current user is logged in.
 * @returns {boolean} - True if the user is logged in.
 */
export function isUserLoggedIn() {
    return wixUsers.currentUser.loggedIn;
}

/**
 * Retrieves the ID of the currently logged-in user.
 * @returns {string|null} - The user's ID or null if not logged in.
 */
export function getCurrentUserId() {
    if (wixUsers.currentUser.loggedIn) {
        return wixUsers.currentUser.id;
    }
    return null;
}