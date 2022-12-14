# medigo-ci-script

### Run Docker locally for debugging
Note: On Linux/Unix machine, we need to use $(PWD) instead of %cd%
```
step 'Run docker in interactive mode':    
    docker run -it ^
    --volume=%cd%:/opt/workspace ^
    --workdir=/opt/workspace ^
    --rm phucsolver/jdk8-android-node ^
    /bin/bash
```

### Call upload.js
- Sample paths:
```
D:/Phuc/Medigo/apks/August/Pharmacy-2.2.0.3(103)-dev-release.apk
D:/Phuc/Medigo/apks/August/User-ecom2.0_1.2.0(115)-dev-release.apk
D:/Phuc/Medigo/medigo-ci/TestAppium/testcases/test-packages/zip-with-dependencies-22-8.zip
```

- Precondition: currently in script folder

- Sample buildspec:
```
    - UPLOAD_NAME="user-ci.apk" &&
    - > 
    echo "Set folder contains .apk file" &&
    APK_BASE_DIR="./build/" && 
    ls ${APK_BASE_DIR}
    
    - >
    echo "Uploading artifacts" && 
    PATH_TO_APK=$(ls ./${APK_BASE_DIR}*.apk) &&
    npm install &&
    node upload.js $PATH_TO_APK $UPLOAD_NAME && 
    echo "Uploaded"
```
### Call test.js
