/**
 * AXYNTRAX - SOCIAL MEDIA CONNECTORS
 * Real integration for Meta (FB/IG) and LinkedIn.
 * Uses native fetch (Node 18+) to minimize dependency issues.
 */

class MetaConnector {
    constructor(token, pageId, igAccountId) {
        this.token = token;
        this.pageId = pageId;
        this.igAccountId = igAccountId;
    }

    async postToFacebook(message) {
        if (!this.token || this.token === 'PENDIENTE') {
            console.log(`[FB-STUB] Posting: ${message.substring(0, 50)}...`);
            return { success: true, id: "fb_stub_" + Date.now() };
        }
        try {
            const url = `https://graph.facebook.com/v19.0/${this.pageId}/feed`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    access_token: this.token
                })
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error?.message || 'Unknown Error');
            return { success: true, id: data.id };
        } catch (err) {
            console.error(`[FB ERR] ${err.message}`);
            return { success: false, error: err.message };
        }
    }

    async postToInstagram(imageUrl, caption) {
        if (!this.token || this.token === 'PENDIENTE') {
            console.log(`[IG-STUB] Posting Image with caption: ${caption.substring(0, 50)}...`);
            return { success: true, id: "ig_stub_" + Date.now() };
        }
        try {
            // 1. Create Media Container
            const containerUrl = `https://graph.facebook.com/v19.0/${this.igAccountId}/media`;
            const containerResp = await fetch(containerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    caption: caption,
                    access_token: this.token
                })
            });
            const containerData = await containerResp.json();
            if (!containerResp.ok) throw new Error(containerData.error?.message || 'Container Creation Failed');
            
            const creationId = containerData.id;

            // 2. Publish Media
            const publishUrl = `https://graph.facebook.com/v19.0/${this.igAccountId}/media_publish`;
            const publishResp = await fetch(publishUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: creationId,
                    access_token: this.token
                })
            });
            const publishData = await publishResp.json();
            if (!publishResp.ok) throw new Error(publishData.error?.message || 'Publish Failed');
            
            return { success: true, id: publishData.id };
        } catch (err) {
            console.error(`[IG ERR] ${err.message}`);
            return { success: false, error: err.message };
        }
    }
}

class LinkedInConnector {
    constructor(token, personId) {
        this.token = token;
        this.personId = personId;
    }

    async post(message) {
        if (!this.token || this.token === 'PENDIENTE') {
            console.log(`[LI-STUB] Posting: ${message.substring(0, 50)}...`);
            return { success: true, id: "li_stub_" + Date.now() };
        }
        try {
            const url = `https://api.linkedin.com/v2/ugcPosts`;
            const body = {
                "author": `urn:li:person:${this.personId}`,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": message
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            };
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.message || 'LinkedIn Error');
            return { success: true, id: data.id };
        } catch (err) {
            console.error(`[LI ERR] ${err.message}`);
            return { success: false, error: err.message };
        }
    }
}

module.exports = { MetaConnector, LinkedInConnector };
