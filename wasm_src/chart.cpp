#include "common.h"

Color black = {20, 20, 20};
Color white = {240, 240, 240};

void Chart::init(int width, int mainHeight, int previewHeight)
{
    mainBmp.init(width, mainHeight);
    prevBmp.init(width, previewHeight);
}

Color Chart::getBackgroundColor()
{
    switch (theme) {
        case 0:
            return white;
            break;
        case 1:
            return black;
            break;
    }
    return black;
}

Color Chart::getGraphColor(int l)
{
    return seriesColors[l % MAX_SERIES];
}

void Chart::setVisibleRect(double x1, double y1, double x2, double y2)
{
    visibleX1 = x1;
    visibleX2 = x2;
    visibleY1 = y1;
    visibleY2 = y2;
}

void Chart::setVisibleRectPrev(double x1, double y1, double x2, double y2)
{
    pvisibleX1 = x1;
    pvisibleX2 = x2;
    pvisibleY1 = y1;
    pvisibleY2 = y2;
}

Point Chart::toDrawingCoordinatesMain(double x, double y)
{
    // transform model coordinates to mainBmp coordinates
    Point p;
    p.x = mainBmp.getWidth() * (x - visibleX1)/(visibleX2 - visibleX1);
    p.y = mainBmp.getHeight() * (y - visibleY2)/(visibleY1 - visibleY2);
    return p;
}

Point Chart::toDrawingCoordinatesPrev(double x, double y)
{
    // transform model coordinates to mainBmp coordinates
    Point p;
    p.x = prevBmp.getWidth() * (x - pvisibleX1)/(pvisibleX2 - pvisibleX1);
    p.y = prevBmp.getHeight() * (y - pvisibleY2)/(pvisibleY1 - pvisibleY2);
    return p;
}

void Chart::renderMain()
{
    //mainBmp.fillBackground(getBackgroundColor());
    mainBmp.clearBackground();
    Color mc = {0xbb, 0xbb, 0xbb};
    for (int i=0; i<xMarkCount; ++i) {
        Point p = toDrawingCoordinatesMain(xMarks[i], 0);
        for (int j=0; j<mainBmp.getHeight(); ++j) {
            mainBmp.setPoint(p.x, j, 0xFF, mc);
        }
    }
    for (int i=0; i<yMarkCount; ++i) {
        Point p = toDrawingCoordinatesMain(0, yMarks[i]);
        for (int j=0; j<mainBmp.getWidth(); ++j) {
            mainBmp.setPoint(j, p.y, 0xFF, mc);
        }
    }

    for (int s=0; s<seriesCount; ++s) {
        if (seriesEnabled[s]) {
            Color c = getGraphColor(s);
            PolyLine l(0.8, 0.0, c);
            for (int i=0; i<pointCount[s]; ++i) {
                l.addPoint(toDrawingCoordinatesMain(dataX[s][i], dataY[s][i]));
            }
            l.draw(&mainBmp);
        }
    }
}

void Chart::renderPrev()
{
    //prevBmp.fillBackground(getBackgroundColor());
    prevBmp.clearBackground();
    for (int s=0; s<seriesCount; s++) {
        if (seriesEnabled[s]) {
            Color c = getGraphColor(s);
            PolyLine l(0.3, 0.0, c);
            for (int i=0; i<pointCount[s]; i++) {
                l.addPoint(toDrawingCoordinatesPrev(dataX[s][i], dataY[s][i]));
            }
            l.draw(&prevBmp);
        }
    }
}

double Chart::getCanvasX(double x)
{
    Point p = toDrawingCoordinatesMain(x, 0);
    return p.x;
}

double Chart::getCanvasY(double y)
{
    Point p = toDrawingCoordinatesMain(0, y);
    return p.y;
}


void Chart::setSeriesCount(int sc)
{
    seriesCount = sc;
    for (int i=0; i<sc; ++i) {
        pointCount[i] = 0;
        seriesEnabled[i] = true;
    }
}

void Chart::addDataPoint(int series, double x, double y)
{
    if (pointCount[series] < MAX_POINTS) {
        dataX[series][pointCount[series]] = x;
        dataY[series][pointCount[series]] = y;
        pointCount[series]++;
    }
}

void Chart::toggleSeries(int series, bool enable)
{
    seriesEnabled[series] = enable;
}

void Chart::setSeriesColor(int series, int r, int g, int b)
{
    Color c = {r, g, b};
    if (series < MAX_SERIES)
        seriesColors[series] = c;
}

void Chart::addXMark(double m)
{
    if (xMarkCount < MAX_MARKS)
        xMarks[xMarkCount++] = m;
}

void Chart::addYMark(double m)
{
    if (yMarkCount < MAX_MARKS)
        yMarks[yMarkCount++] = m;
}

void Chart::removeXMark(double m)
{
    for (int i=0; i<xMarkCount; ++i) {
        if (fabs(xMarks[i] - m) < 1.0) {
            for (; i<xMarkCount-1; ++i) {
                xMarks[i] = xMarks[i+1];
            }
            xMarkCount--;
            break;
        }
    }
}

void Chart::removeYMark(double m)
{
    for (int i=0; i<yMarkCount; ++i) {
        if (fabs(yMarks[i] - m) < 1.0) {
            for (; i<yMarkCount-1; ++i) {
                yMarks[i] = yMarks[i+1];
            }
            yMarkCount--;
            break;
        }
    }
}

void Chart::resetMarks()
{
    xMarkCount = 0;
    yMarkCount = 0;
}
