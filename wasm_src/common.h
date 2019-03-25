#define BYTE unsigned char

#include <math.h>

#include "point.h"
#include "color.h"
#include "bitmap.h"
#include "element.h"
#include "line.h"
#include "polyline.h"
#include "chart.h"

#define WASM_EXPORT __attribute__((used)) __attribute__ ((visibility ("default")))
