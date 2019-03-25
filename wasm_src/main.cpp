#include "common.h"

Chart chart;

WASM_EXPORT
void init(int w, int mainH, int prevH) {
    chart.init(w, mainH, prevH);
}

void WASM_EXPORT setTheme(int t) {
    chart.setTheme(t);
}

unsigned int* WASM_EXPORT renderMain() {
    chart.renderMain();
    return chart.getMainBmp();
}

unsigned int* WASM_EXPORT renderPrev() {
    chart.renderPrev();
    return chart.getPrevBmp();
}

void WASM_EXPORT setSeriesCount(int series) {
    chart.setSeriesCount(series);
}

void WASM_EXPORT addDataPoint(int series, double x, double y) {
    chart.addDataPoint(series, x, y);
}

void WASM_EXPORT toggleSeries(int series, bool enable) {
    chart.toggleSeries(series, enable);
}

void WASM_EXPORT setSeriesColor(int series, int r, int g, int b) {
    chart.setSeriesColor(series, r, g, b);
}

void WASM_EXPORT setVisibleRect(double x1, double y1, double x2, double y2) {
    chart.setVisibleRect(x1, y1, x2, y2);
}

void WASM_EXPORT setVisibleRectPrev(double x1, double y1, double x2, double y2) {
    chart.setVisibleRectPrev(x1, y1, x2, y2);
}

void WASM_EXPORT addXMark(double m) {
    chart.addXMark(m);
}

void WASM_EXPORT addYMark(double m) {
    chart.addYMark(m);
}

void WASM_EXPORT removeXMark(double m) {
    chart.removeXMark(m);
}

void WASM_EXPORT removeYMark(double m) {
    chart.removeYMark(m);
}

void WASM_EXPORT resetMarks() {
    chart.resetMarks();
}

WASM_EXPORT double getCanvasX(double x) {
    return chart.getCanvasX(x);
}

WASM_EXPORT double getCanvasY(double y) {
    return chart.getCanvasY(y);
}

//#define TEST

#ifdef TEST
#include <iostream>
using namespace std;




int main() {
    Point p1 = {1, 1};
    Point p2 = {3, 2};
    Point p3 = {3, 1};
    Point p = {4, 2};

    cout << (belongsToHemiplane(p1, p2, p3, p)?1:0) << endl;


    return 0;
}
#endif
