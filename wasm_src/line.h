class Line : public IElement {
    Point p1;
    Point p2;
    double thickness;
    double blur;
    Color color;

    int alpha(double distance);
    bool pointInView(Bitmap *bmp, int x, int y);

    //Метод, устанавливающий пиксел на форме с заданными цветом и прозрачностью
    void PutPixel(Bitmap *bmp, Color &col, int x, int y, int alpha);

    //Целая часть числа
    int IPart(float x);

    //дробная часть числа
    float FPart(float x);

protected:
    void drawEnd(Bitmap *bmp, int x, int y);
    void drawSection(Bitmap *bmp, int x1, int x2, int y1, int y2);

    void DrawWuLine(Bitmap *bmp, int x0, int y0, int x1, int y1);

    double getThickness() { return thickness; }


public:
    Line(Point &_p1, Point &_p2, double _thickness, double _blur, Color &_color);
    Line(double _thickness, double _blur, Color &_color);

    void draw(Bitmap *bmp);
};
