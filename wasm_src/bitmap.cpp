#include "common.h"

void Bitmap::init(int w, int h)
{
    if (w > MAX_WIDTH) w = MAX_WIDTH;
    if (h > MAX_HEIGHT) h = MAX_HEIGHT;
    width = w;
    height = h;
}

void Bitmap::setPoint(int x, int y, BYTE a, Color &color)
{
    long offset = y * width + x;
    if ((0 <= x) && (x < width) && (0 <= y) && (y < height))
        data[offset] = (a << 24) | (color.b << 16) | (color.g << 8) | color.r;
}

void Bitmap::mergePoint(int x, int y, BYTE a, Color &color)
{
    long offset = y * width + x;
    if ((0 <= x) && (x < width) && (0 <= y) && (y < height)) {

        int oldA = data[offset] & 0xFF000000 >> 24;
        int newA = oldA + a + 255;
        if (newA > 255) newA = 255;
        if (oldA < 255)
            data[offset] = (newA << 24) | (color.b << 16) | (color.g << 8) | color.r;
    }
}

void Bitmap::fillBackground(Color color)
{
    for (int i=0; i<width*height; ++i) {
        data[i] = (0xFF << 24) | (color.b << 16) | (color.g << 8) | color.r;
    }
}

void Bitmap::clearBackground()
{
    for (int i=0; i<width*height; ++i) {
        data[i] = 0;
    }
}
