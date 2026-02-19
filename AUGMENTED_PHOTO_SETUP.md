# Installation Instructions for Augmented Photo Feature

## Install Required Package

Run this command in the frontend-mobile directory:

```bash
npm install react-native-view-shot
```

## For Android - Update Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## Rebuild the App

```bash
# For Android
npm run android

# For iOS (if applicable)
cd ios && pod install && cd ..
npm run ios
```

## How It Works

1. Admin uploads a reference image (overlay) in the admin panel
2. User opens the task with "Capture An Augmented Photo" answer type
3. User clicks camera button and takes a photo
4. The admin's overlay image is automatically placed on top of the captured photo
5. The merged image is:
   - Saved to device storage (DCIM/IziMorocco folder on Android)
   - Saved to app's document directory
   - Uploaded to the database via the existing uploadFile service
6. User can see the final augmented photo before submitting
