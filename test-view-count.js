const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testViewCount() {
  try {
    console.log('🧪 Testing view count functionality...\n');

    // Step 1: Get all albums to find a test album
    console.log('1️⃣ Getting all albums...');
    const albumsResponse = await axios.get(`${BASE_URL}/albums`);
    const albums = albumsResponse.data.data;

    if (albums.length === 0) {
      console.log('❌ No albums found. Please create an album first.');
      return;
    }

    const testAlbum = albums[0];
    const albumId = testAlbum.id;
    const initialViewCount = testAlbum.viewCount || 0;

    console.log(`✅ Found test album: "${testAlbum.name}" (ID: ${albumId})`);
    console.log(`📊 Initial view count: ${initialViewCount}\n`);

    // Step 2: Access album directly via GET /albums/:id
    console.log('2️⃣ Accessing album directly...');
    const albumResponse = await axios.get(`${BASE_URL}/albums/${albumId}`);
    const albumAfterDirectAccess = albumResponse.data.data;
    console.log(`📊 View count after direct access: ${albumAfterDirectAccess.viewCount}\n`);

    // Step 3: Access album photos via GET /photos/:albumId
    console.log('3️⃣ Accessing album photos...');
    const photosResponse = await axios.get(`${BASE_URL}/photos/${albumId}`);
    console.log(`📸 Found ${photosResponse.data.data.length} photos in album`);

    // Step 4: Check final view count
    const finalAlbumResponse = await axios.get(`${BASE_URL}/albums/${albumId}`);
    const finalViewCount = finalAlbumResponse.data.data.viewCount;

    console.log(`📊 Final view count: ${finalViewCount}`);
    console.log(`📈 View count increased by: ${finalViewCount - initialViewCount}`);

    if (finalViewCount > initialViewCount) {
      console.log('✅ View count functionality is working correctly!');
    } else {
      console.log('❌ View count functionality may not be working as expected.');
    }

  } catch (error) {
    console.error('❌ Error testing view count:', error.response?.data || error.message);
  }
}

// Only run if server is available
async function checkServerAndTest() {
  try {
    await axios.get(`${BASE_URL}/albums`);
    await testViewCount();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: pnpm run start:dev');
    console.log('   Then run this test again with: node test-view-count.js');
  }
}

checkServerAndTest();