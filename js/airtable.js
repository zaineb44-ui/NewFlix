// Airtable configuration – updated with your new Base and Table IDs
const AIRTABLE_BASE = 'apphFKUZi8st0hHTE';
const AIRTABLE_TOKEN = 'patwtpgmgRGDxBdkF.45c1aa777f615bd961be32fe2661fbe8982e2c003c871fa00339ad9c44b9161a';

// Table IDs (optional – you can use table names instead)
const TABLE_USERS = 'Users';
const TABLE_WATCHLIST = 'tblIyXDc0Z8AaY6tm';
const TABLE_CONTINUE = 'tblcTM8OeLgNpnDMJ';

// Helper for Airtable API calls
async function airtableRequest(tableId, method = 'GET', recordId = null, data = null) {
  // Use table ID or name – here we use the ID
  const tableName = tableId; // we pass the ID directly
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${tableName}` + (recordId ? `/${recordId}` : '');
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (data) options.body = JSON.stringify(data);
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Airtable error: ${res.status}`);
  }
  return res.json();
}

// ─── Users ──────────────────────────────
async function getUsers() {
  const result = await airtableRequest(TABLE_USERS);
  return result.records;
}

async function getUserByEmail(email) {
  const filter = encodeURIComponent(`{Email}="${email}"`);
  const result = await airtableRequest(`${TABLE_USERS}?filterByFormula=${filter}`);
  return result.records;
}

async function createUser(name, email, password) {
  const data = {
    fields: {
      Name: name,
      Email: email,
      Password: password  // In production, hash the password!
    }
  };
  const result = await airtableRequest(TABLE_USERS, 'POST', null, data);
  return result;
}

// ─── Watchlist ──────────────────────────
async function getWatchlist(userId) {
  const filter = encodeURIComponent(`{UserId}="${userId}"`);
  const result = await airtableRequest(`${TABLE_WATCHLIST}?filterByFormula=${filter}`);
  return result.records;
}

async function addWatchlist(userId, tmdbId, type) {
  const data = {
    fields: {
      UserId: userId,
      TmdbId: String(tmdbId),
      Type: type
    }
  };
  const result = await airtableRequest(TABLE_WATCHLIST, 'POST', null, data);
  return result;
}

async function deleteWatchlist(recordId) {
  await airtableRequest(TABLE_WATCHLIST, 'DELETE', recordId);
}

// ─── Continue Watching ──────────────────
async function getContinueWatching(userId) {
  const filter = encodeURIComponent(`{UserId}="${userId}"`);
  const result = await airtableRequest(`${TABLE_CONTINUE}?filterByFormula=${filter}`);
  return result.records;
}

async function addContinueWatching(userId, tmdbId, type, season = 1, episode = 1) {
  const data = {
    fields: {
      UserId: userId,
      TmdbId: String(tmdbId),
      Type: type,
      Season: season,
      Episode: episode,
      Timestamp: Date.now()
    }
  };
  // Check if exists, update if so
  const existing = await getContinueWatching(userId);
  const found = existing.find(r => r.fields.TmdbId === String(tmdbId) && r.fields.Type === type);
  if (found) {
    const updateData = {
      fields: {
        Season: season,
        Episode: episode,
        Timestamp: Date.now()
      }
    };
    const result = await airtableRequest(TABLE_CONTINUE, 'PATCH', found.id, updateData);
    return result;
  } else {
    const result = await airtableRequest(TABLE_CONTINUE, 'POST', null, data);
    return result;
  }
}

async function deleteContinueWatching(recordId) {
  await airtableRequest(TABLE_CONTINUE, 'DELETE', recordId);
}

// ─── Sync local data to Airtable ──────
async function syncLocalDataToAirtable(userId) {
  // Watchlist
  const localWatchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  const cloudWatchlist = await getWatchlist(userId);
  const cloudIds = cloudWatchlist.map(r => r.fields.TmdbId + r.fields.Type);

  for (const item of localWatchlist) {
    const key = item.id + item.type;
    if (!cloudIds.includes(key)) {
      await addWatchlist(userId, item.id, item.type);
    }
  }

  // Continue Watching
  const localContinue = JSON.parse(localStorage.getItem('continueWatchingList')) || [];
  const cloudContinue = await getContinueWatching(userId);
  const cloudContinueIds = cloudContinue.map(r => r.fields.TmdbId + r.fields.Type);

  for (const item of localContinue) {
    const key = item.id + item.type;
    if (!cloudContinueIds.includes(key)) {
      await addContinueWatching(userId, item.id, item.type, item.season || 1, item.episode || 1);
    }
  }
}