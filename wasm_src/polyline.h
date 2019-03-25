#define MAX_POINTS 1024

class PolyLine : public Line {
    Point points[MAX_POINTS];
    int pointCount;

public:
    PolyLine(double _thickness, double _blur, Color &_color);
    void addPoint(const Point &p);

    void draw(Bitmap *bmp);


};
