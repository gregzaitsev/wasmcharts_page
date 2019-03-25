#include "common.h"

PolyLine::PolyLine(double _thickness, double _blur, Color &_color) :
    Line(_thickness, _blur, _color),
    pointCount(0)
{
}

void PolyLine::addPoint(const Point &p)
{
    points[pointCount] = p;
    pointCount++;
}

void PolyLine::draw(Bitmap *bmp)
{
    // Begins and ends as circles
    //for (int i=0; i<pointCount; ++i) {
    //    drawEnd(bmp, points[i].x, points[i].y);
    //}

    // Draw the rest as fading lines
    for (int i=0; i<pointCount-1; ++i) {
        if (getThickness() < 0.4)
            DrawWuLine(bmp, points[i].x, points[i].y, points[i+1].x, points[i+1].y);
        else
            drawSection(bmp, points[i].x, points[i+1].x, points[i].y, points[i+1].y);
    }

}
