// auth.js

var firebaseConfig = {
    apiKey: "AIzaSyA3mKrobUuLuc3zoZK7qe04I7-v_H9K8og",
    authDomain: "ai-coding-mentor.firebaseapp.com",
    projectId: "ai-coding-mentor",
    storageBucket: "ai-coding-mentor.firebasestorage.app",
    messagingSenderId: "271823308691",
    appId: "1:271823308691:web:929162594fa447eb908a66"
};

const GOOGLE_CLIENT_ID = "271823308691-qf5judnop1o1r4lk2agv0343tvuda8jt.apps.googleusercontent.com";

let app;
if (firebase.apps.length === 0) {
    app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase App explicitly initialized!");
} else {
    app = firebase.app();
}

async function signInWithGoogle() {
    return new Promise((resolve) => {
        const redirectUri = chrome.identity.getRedirectURL();
        
        // ADDED: &prompt=select_account at the very end of this URL string
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&response_type=id_token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&nonce=${Math.random().toString(36).substring(2)}&prompt=select_account`;

        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                console.error("Auth Error:", chrome.runtime.lastError);
                return resolve(null);
            }

            const urlHash = new URL(responseUrl).hash.substring(1);
            const params = new URLSearchParams(urlHash);
            const idToken = params.get("id_token");

            if (!idToken) {
                console.error("No token found.");
                return resolve(null);
            }

            try {
                const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
                const result = await app.auth().signInWithCredential(credential);
                console.log("Logged in as:", result.user.email);
                resolve(result.user);
            } catch (error) {
                console.error("Firebase connection error:", error);
                resolve(null);
            }
        });
    });
}

async function checkUserPremium(uid) {
    try {
        console.log("Checking database for user:", uid);
        
        const userRef = app.firestore().collection('users').doc(uid);
        const doc = await userRef.get();

        if (doc.exists) {
            return doc.data().premium === true;
        } else {
            console.log("New user detected. Creating free profile...");
            await userRef.set({ premium: false, signupDate: new Date().toISOString() });
            return false;
        }
    } catch (error) {
        console.error("Error accessing database:", error);
        return false;
    }
}

window.signInWithGoogle = signInWithGoogle;
window.checkUserPremium = checkUserPremium;
window.signOut = () => app.auth().signOut();

async function upgradeUserToPremium(uid) {
    try {
        console.log("Upgrading user to premium in database...");
        await app.firestore().collection('users').doc(uid).update({ 
            premium: true 
        });
        return true;
    } catch (error) {
        console.error("Error upgrading user:", error);
        return false;
    }
}

function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = app.auth().onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
}

window.signInWithGoogle = signInWithGoogle;
window.checkUserPremium = checkUserPremium;
window.upgradeUserToPremium = upgradeUserToPremium;
window.getCurrentUser = getCurrentUser;
window.signOut = () => app.auth().signOut();