This C++ code produces a wasm file that provides rendering for in-browser
JavaScript canvas.

In order to compile this code, do the following:

1. Checkout emsdk from github
2. Run this:

./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

3. Compile:

emcc main.cpp polyline.cpp line.cpp bitmap.cpp chart.cpp -O3 -s WASM=1 -o main.wasm
