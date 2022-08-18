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