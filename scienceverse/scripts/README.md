# Upload Mock Data to Firebase

This script uploads example videos and evaluations to your Firebase Firestore database.

## Prerequisites

1. **Firebase Admin SDK Service Account Key**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Select your project: `scienceverse-competition`
   - Click the gear icon ⚙️ → Project Settings
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Download the JSON file
   - **Rename it to:** `scienceverse-competition-firebase-adminsdk.json`
   - **Move it to the project root:** `D:\Durga\AI\Claude\scienceapp\`

2. **Install Dependencies**
   ```bash
   npm install firebase-admin
   ```

## Running the Script

```bash
cd D:\Durga\AI\Claude\scienceapp
node scripts/uploadMockData.js
```

## What This Script Does

### Uploads 5 Example Videos:
1. **How to Make a Volcano** - Chemistry experiment
2. **Solar Panel from Scratch** - Physics/renewable energy
3. **Water Purification System** - Environmental science
4. **Growing Plants in Space** - Biology/hydroponics
5. **Crop Disease Detection App** - Technology/AI

### Uploads 12 Example Evaluations:
- From judges, teachers, and students
- With ratings on all 4 dimensions
- With detailed comments

### Video Details:
- All videos are set to **status: "active"** (approved)
- Have proper metadata (school, district, category, etc.)
- Include aggregate scores and evaluation counts
- Use publicly available sample videos (Big Buck Bunny, etc.)
- Have thumbnail URLs from Unsplash

## After Running

1. **Refresh your app** (Ctrl+Shift+R)
2. **Check Discovery feed** - You should see 5 example videos
3. **Click on a video** - It should play
4. **View evaluations** - Each video has sample evaluations

## Important Notes

- ⚠️ **Run this only ONCE** to avoid duplicate data
- The script will create **new documents** each time it runs
- Videos will be visible to all users (status: active)
- The service account key file should **NOT** be committed to Git
- Make sure `.gitignore` includes `*firebase-adminsdk*.json`

## Troubleshooting

**Error: "Cannot find module firebase-admin"**
```bash
npm install firebase-admin
```

**Error: "Cannot find service account key"**
- Make sure the file is named exactly: `scienceverse-competition-firebase-adminsdk.json`
- Make sure it's in the project root directory
- Path should be: `D:\Durga\AI\Claude\scienceapp\scienceverse-competition-firebase-adminsdk.json`

**Error: "Permission denied"**
- Check that the service account has Firestore write permissions
- Go to Firebase Console → Firestore Database → Rules
- Make sure admin access is properly configured

## Verify Upload Success

1. **Firebase Console:**
   - Go to Firestore Database
   - Check `videos` collection - should have 5 documents
   - Check `evaluations` collection - should have 12 documents

2. **In Your App:**
   - Login with any account
   - Go to Discovery tab
   - You should see 5 videos with thumbnails
   - Click any video to play it
   - Click "View Evaluations" to see sample ratings

## Clean Up (Optional)

If you want to remove the mock data later:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Manually delete the uploaded documents
4. Or use Firebase CLI: `firebase firestore:delete --all-collections`
