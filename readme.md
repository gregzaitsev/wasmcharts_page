

./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

emcc main.cpp polyline.cpp line.cpp bitmap.cpp chart.cpp -O3 -s WASM=1 -o main.wasm



This file to base64 conversion works:
https://www.browserling.com/tools/file-to-base64


This demo project is hosted on GitHub pages:
https://gregzaitsev.github.io/wasmcharts_page/
