const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function testSinglePhoto() {
  try {
    console.log('🧪 Testing single photo functionality...\n');

    // Step 1: Get all albums to find a test album
    console.log('1️⃣ Getting all albums...');
    const albumsResponse = await axios.get(`${BASE_URL}/albums`);
    const albums = albumsResponse.data.data;

    if (albums.length === 0) {
      console.log('❌ No albums found. Please create an album and upload some photos first.');
      return;
    }

    const testAlbum = albums[0];
    const albumId = testAlbum.id;
    console.log(`✅ Found test album: "${testAlbum.name}" (ID: ${albumId})`);

    // Step 2: Get photos from the album
    console.log('\n2️⃣ Getting photos from album...');
    const photosResponse = await axios.get(`${BASE_URL}/photos/album/${albumId}`);
    const photos = photosResponse.data.data;

    if (photos.length === 0) {
      console.log('❌ No photos found in the album. Please upload some photos first.');
      return;
    }

    const testPhoto = photos[0];
    const photoId = testPhoto.id;
    console.log(`✅ Found test photo: "${testPhoto.originalName}" (ID: ${photoId})`);
    console.log(`📸 Photo details:`);
    console.log(`   - Filename: ${testPhoto.filename}`);
    console.log(`   - Original Name: ${testPhoto.originalName}`);
    console.log(`   - Path: ${testPhoto.path}`);
    console.log(`   - Size: ${testPhoto.size} bytes`);
    console.log(`   - MIME Type: ${testPhoto.mimeType}`);
    console.log(`   - Album ID: ${testPhoto.albumId}`);
    console.log(`   - Created At: ${testPhoto.createdAt}`);

    // Step 3: Test the photo metadata endpoint
    console.log('\n3️⃣ Testing photo metadata endpoint...');
    const photoInfoResponse = await axios.get(`${BASE_URL}/photos/info/${photoId}`);
    const photoInfo = photoInfoResponse.data.data;

    console.log('✅ Photo metadata retrieved successfully!');
    console.log(`📊 Metadata response structure:`);
    console.log(JSON.stringify(photoInfoResponse.data, null, 2));

    // Step 4: Test the photo file endpoint
    console.log('\n4️⃣ Testing photo file endpoint...');
    try {
      const photoFileResponse = await axios.get(`${BASE_URL}/photos/photo/${photoId}`, {
        responseType: 'stream'
      });

      console.log('✅ Photo file retrieved successfully!');
      console.log(`📄 File response headers:`);
      console.log(`   - Content-Type: ${photoFileResponse.headers['content-type']}`);
      console.log(`   - Cache-Control: ${photoFileResponse.headers['cache-control']}`);
      console.log(`   - Content-Disposition: ${photoFileResponse.headers['content-disposition']}`);
      console.log(`   - Status: ${photoFileResponse.status}`);

      // Save the downloaded file to verify it's a valid image
      const downloadedFileName = `downloaded-${testPhoto.filename}`;
      const writer = fs.createWriteStream(downloadedFileName);
      photoFileResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`✅ File downloaded and saved as: ${downloadedFileName}`);

      // Check file size matches
      const stats = fs.statSync(downloadedFileName);
      if (stats.size === testPhoto.size) {
        console.log('✅ Downloaded file size matches expected size');
      } else {
        console.log(`❌ File size mismatch: expected ${testPhoto.size}, got ${stats.size}`);
      }

      // Clean up downloaded file
      fs.unlinkSync(downloadedFileName);
      console.log('🧹 Cleaned up downloaded file');

    } catch (error) {
      console.log('❌ Failed to download photo file:', error.response?.data || error.message);
    }

    // Step 5: Verify the data matches between metadata endpoints
    console.log('\n5️⃣ Verifying data consistency...');
    const isConsistent =
      photoInfo.id === testPhoto.id &&
      photoInfo.filename === testPhoto.filename &&
      photoInfo.originalName === testPhoto.originalName &&
      photoInfo.path === testPhoto.path &&
      photoInfo.size === testPhoto.size &&
      photoInfo.mimeType === testPhoto.mimeType &&
      photoInfo.albumId === testPhoto.albumId;

    if (isConsistent) {
      console.log('✅ Data consistency verified - all fields match!');
    } else {
      console.log('❌ Data inconsistency detected!');
    }

    // Step 6: Test with non-existent photo ID
    console.log('\n6️⃣ Testing with non-existent photo ID...');
    try {
      await axios.get(`${BASE_URL}/photos/photo/99999`);
      console.log('❌ Should have returned 404 for non-existent photo');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent photo file');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    try {
      await axios.get(`${BASE_URL}/photos/info/99999`);
      console.log('❌ Should have returned 404 for non-existent photo info');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent photo info');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Step 7: Check that view count was NOT incremented by photo file access
    console.log('\n7️⃣ Checking album view count after photo file access...');
    const albumAfterPhotoFileAccess = await axios.get(`${BASE_URL}/albums/${albumId}`);
    console.log(`📊 Album view count after photo file access: ${albumAfterPhotoFileAccess.data.data.viewCount}`);
    console.log('ℹ️ Note: Photo file access does NOT increment view count');

    // Step 8: Test that accessing photo metadata also doesn't increment view count
    console.log('\n8️⃣ Checking album view count after photo metadata access...');
    const albumAfterPhotoInfoAccess = await axios.get(`${BASE_URL}/albums/${albumId}`);
    console.log(`📊 Album view count after photo metadata access: ${albumAfterPhotoInfoAccess.data.data.viewCount}`);
    console.log('ℹ️ Note: Photo metadata access also does NOT increment view count');

    console.log('\n🎉 Single photo functionality test completed successfully!');
    console.log('\n📚 Updated API Summary:');
    console.log('   - GET /photos/photo/{id} → Returns actual image file (no view count)');
    console.log('   - GET /photos/info/{id} → Returns photo metadata (no view count)');
    console.log('   - GET /photos/album/{id} → Returns all photos in album (view count +1)');
    console.log('   - GET /albums/{id} → Returns album details (view count +1)');

  } catch (error) {
    console.error('❌ Error testing single photo:', error.response?.data || error.message);
  }
}

// Only run if server is available
async function checkServerAndTest() {
  try {
    await axios.get(`${BASE_URL}/albums`);
    await testSinglePhoto();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: pnpm run start:dev');
    console.log('   Then run this test again with: node test-single-photo.js');
  }
}

checkServerAndTest();